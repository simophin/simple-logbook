use std::time::SystemTime;

use serde_derive::*;
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

const DEFAULT_VARIANT: base64::Variant = base64::Variant::Original;

fn now() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("Timestamp")
        .as_secs()
}

impl CredentialsConfig {
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

    pub fn sign(&self) -> String {
        let token = Token {
            exp: now() + 3600 * 24 * 10,
        };

        let mut token = serde_json::to_vec(&token).expect("To serialize to json");
        let tag = crypto::auth::authenticate(&token, &self.get_signing_key());
        token.extend_from_slice(tag.as_ref());
        base64::encode(token, DEFAULT_VARIANT)
    }

    pub fn verify_token(&self, token: &str) -> Option<()> {
        let token = base64::decode(token, DEFAULT_VARIANT).ok()?;
        if token.len() < crypto::auth::TAGBYTES {
            return None;
        }

        let (json, tag) = token.split_at(token.len() - crypto::auth::TAGBYTES);
        if crypto::auth::verify(
            &crypto::auth::Tag::from_slice(tag)?,
            json,
            &self.get_signing_key(),
        ) {
            let Token { exp } = serde_json::from_slice(json).ok()?;
            if now() > exp {
                return None;
            }

            Some(())
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
        let token = c.sign();
        assert_eq!(c.verify_token(&token), Some(()));
        assert_eq!(c.verify_password("12345"), Some(()));
        assert_eq!(c.verify_password("123456"), None);
        let token = format!("{}1", token);
        assert_eq!(c.verify_token(&token), None);
    }
}
