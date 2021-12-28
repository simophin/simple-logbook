use std::borrow::Cow;

use crate::service::login::creds::Signed;
use serde_derive::*;

use crate::state::AppState;

use super::super::{Error, Result};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub old_password: String,
    pub new_password: String,
}

#[derive(Serialize)]
pub struct Output {
    pub token: Signed<'static>,
}

pub async fn execute(
    state: &AppState,
    Input {
        old_password,
        new_password,
    }: Input,
) -> Result<Output> {
    use super::creds::*;
    use crate::service::config;
    let credentials = config::update(
        CREDENTIALS_CONFIG_KEY,
        None,
        |c| {
            // Verify old password first
            match c
                .as_ref()
                .as_ref()
                .map(|v| serde_json::from_str::<CredentialsConfig>(v))
            {
                Some(Ok(config)) if config.verify_password(&old_password).is_none() => {
                    return Err(Error::InvalidCredentials)
                }
                _ => {}
            }

            if new_password.is_empty() {
                *c = Cow::Owned(None);
                Ok(None)
            } else {
                let new_config = CredentialsConfig::new(&new_password);
                *c = Cow::Owned(Some(
                    serde_json::to_string(&new_config).expect("To serialize"),
                ));
                Ok(Some(new_config))
            }
        },
        &state.conn,
    )
    .await??;

    Ok(Output {
        token: credentials
            .map(|c| {
                c.sign(&Asset::new(
                    super::DEFAULT_LOGIN_TOKEN_VALID_DURATION,
                    None,
                    None,
                ))
            })
            .unwrap_or_default(),
    })
}
