use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::ops::Deref;
use std::time::{Duration, SystemTime};

use crate::AppState;
use sodiumoxide::{base64, crypto};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialsConfig {
    password_hashed: String,
    signing_key: String,
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Asset<'a> {
    exp: u64,
    pub kind: Option<Cow<'a, str>>,
    pub id: Option<Cow<'a, str>>,
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

impl<'a> Asset<'a> {
    pub fn new(exp_delay: Duration, kind: Option<&'a str>, id: Option<&'a str>) -> Self {
        Self {
            exp: now_seconds() + exp_delay.as_secs(),
            kind: kind.map(Cow::from),
            id: id.map(Cow::from),
        }
    }

    pub fn sign(&self, config: Option<&CredentialsConfig>) -> Signed<'static> {
        match config {
            Some(c) => c.sign(self),
            None => Signed(Cow::from(
                serde_json::to_string(self).expect("to convert to json"),
            )),
        }
    }

    pub fn verify<'b: 'a>(s: &Signed, config: Option<&'b CredentialsConfig>) -> Option<Self> {
        match config {
            Some(c) => c.verify(s),
            None => serde_json::from_str::<Self>(s.as_ref()).ok(),
        }
    }
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

    pub fn sign(&self, input: &Asset) -> Signed<'static> {
        let mut result = serde_json::to_vec(input).expect("To serialize asset json");

        let tag = crypto::auth::authenticate(&result, &self.get_signing_key());
        result.extend_from_slice(tag.as_ref());
        Signed(Cow::from(base64::encode(result, DEFAULT_VARIANT)))
    }

    pub fn verify(&self, input: &Signed) -> Option<Asset> {
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
            let result: Asset = serde_json::from_slice(json).ok()?;
            if now_seconds() > result.exp {
                return None;
            }

            Some(result)
        } else {
            None
        }
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
        let token = c.sign(&Asset::new(Duration::from_secs(10), None, None));
        assert!(c.verify(&token).is_some());
        assert_eq!(c.verify_password("12345"), Some(()));
        assert_eq!(c.verify_password("123456"), None);
        let token = format!("{}1", token.to_string());
        assert_eq!(c.verify(&Signed(Cow::from(token))), None);
    }
}
