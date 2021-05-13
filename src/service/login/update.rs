use serde_derive::*;

use crate::service::ErrorWithStatusCode;
use crate::state::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    old_password: String,
    new_password: String,
}

#[derive(Serialize)]
pub struct Output {
    token: String,
}

pub async fn execute(
    state: &AppState,
    Input {
        old_password,
        new_password,
    }: Input,
) -> anyhow::Result<Output> {
    use super::creds::*;
    use crate::config;
    let credentials = config::update::<CredentialsConfig, _, _>(
        CREDENTIALS_CONFIG_KEY,
        None,
        |c| match c {
            Some(config) if config.verify_password(&old_password).is_none() => {
                Err(ErrorWithStatusCode::new(401))
            }
            _ if new_password.is_empty() => Ok(None),
            _ => Ok(Some(super::creds::CredentialsConfig::new(&new_password))),
        },
        &state.conn,
    )
    .await??;

    Ok(Output {
        token: credentials.map(|c| c.sign()).unwrap_or_default(),
    })
}
