use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::ops::Deref;
use std::time::SystemTime;

use crate::AppState;
use sodiumoxide::{base64, crypto};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialsConfig {
    password_hashed: String,
    signing_key: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Token {
    exp: u64,
}

pub type AssetId = String;
pub type AssetKind = String;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Asset<'a> {
    exp: u64,
    id: Cow<'a, str>,
    kind: Cow<'a, str>,
}

trait WithExp {
    fn get_exp_seconds(&self) -> u64;
}

impl WithExp for Token {
    fn get_exp_seconds(&self) -> u64 {
        self.exp
    }
}

impl<'a> WithExp for Asset<'a> {
    fn get_exp_seconds(&self) -> u64 {
        self.exp
    }
}

#[derive(Ord, PartialOrd, Eq, PartialEq, Serialize, Deserialize, Debug, Default)]
pub struct Signed<'a>(pub Cow<'a, str>);

impl<'a> Deref for Signed<'a> {
    type Target = Cow<'a, str>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

const DEFAULT_VARIANT: base64::Variant = base64::Variant::Original;

fn now_seconds() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("Timestamp")
        .as_secs()
}

impl CredentialsConfig {
    pub async fn from_app(state: &AppState) -> Option<Self> {
        crate::service::config::get_json(CREDENTIALS_CONFIG_KEY, None, &state.conn)
            .await
            .unwrap_or(None)
    }

    pub fn verify_password(&self, pw: &str) -> Option<()> {
        if crypto::pwhash::pwhash_verify(
            &crypto::pwhash::HashedPassword::from_slice(
                &base64::decode(&self.password_hashed, DEFAULT_VARIANT).ok()?,
            )?,
            pw.as_bytes(),
        ) {
            Some(())
        } else {
            None
        }
    }

    pub fn get_signing_key(&self) -> crypto::auth::Key {
        crypto::auth::Key::from_slice(
            &base64::decode(&self.signing_key, DEFAULT_VARIANT)
                .expect("A valid signing key in base64"),
        )
        .expect("A valid signing key")
    }

    fn sign(&self, input: &impl Serialize) -> Signed<'static> {
        let mut result = serde_json::to_vec(input).expect("To serialize asset json");

        let tag = crypto::auth::authenticate(&result, &self.get_signing_key());
        result.extend_from_slice(tag.as_ref());
        Signed(Cow::from(base64::encode(result, DEFAULT_VARIANT)))
    }

    fn verify<R: DeserializeOwned + WithExp>(&self, input: &Signed) -> Option<R> {
        let token = base64::decode(input.as_bytes(), DEFAULT_VARIANT).ok()?;
        if token.len() < crypto::auth::TAGBYTES {
            return None;
        }

        let (json, tag) = token.split_at(token.len() - crypto::auth::TAGBYTES);
        if crypto::auth::verify(
            &crypto::auth::Tag::from_slice(tag)?,
            json,
            &self.get_signing_key(),
        ) {
            let result: R = serde_json::from_slice(json).ok()?;
            if now_seconds() > result.get_exp_seconds() {
                return None;
            }

            Some(result)
        } else {
            None
        }
    }

    pub fn sign_asset(&self, id: &str, kind: &str) -> Signed<'static> {
        self.sign(&Asset {
            exp: now_seconds() + 3600,
            id: Cow::from(id),
            kind: Cow::from(kind),
        })
    }

    pub fn verify_asset(&self, token: &Signed) -> Option<(AssetKind, AssetId)> {
        return self
            .verify::<Asset>(token)
            .map(|a| (a.kind.to_string(), a.id.to_string()));
    }

    pub fn sign_token(&self) -> Signed<'static> {
        self.sign(&Token {
            exp: now_seconds() + 3600 * 24 * 10,
        })
    }

    pub fn verify_token(&self, token: &Signed) -> Option<()> {
        return self.verify::<Token>(token).map(|_| ());
    }

    pub fn new(pw: &str) -> Self {
        let signing_key = base64::encode(crypto::auth::gen_key().as_ref(), DEFAULT_VARIANT);
        let password_hashed = base64::encode(
            crypto::pwhash::pwhash_interactive(pw.as_bytes()).unwrap(),
            DEFAULT_VARIANT,
        );
        return Self {
            password_hashed,
            signing_key,
        };
    }
}

pub const CREDENTIALS_CONFIG_KEY: &str = "credentials";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn signing_works() {
        let c = CredentialsConfig::new("12345");
        let token = c.sign_token();
        assert_eq!(c.verify_token(&token), Some(()));
        assert_eq!(c.verify_password("12345"), Some(()));
        assert_eq!(c.verify_password("123456"), None);
        let token = format!("{}1", token);
        assert_eq!(c.verify_token(&Signed(Cow::from(token))), None);
    }
}
