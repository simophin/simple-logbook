use serde_derive::*;

use crate::service::ErrorWithStatusCode;
use crate::state::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    old_password: Option<String>,
    new_password: Option<String>,
}

#[derive(Serialize)]
pub struct Output {
    token: Option<String>,
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
        |c| match c {
            Some(config)
                if config
                    .verify_password(&old_password.unwrap_or_default())
                    .is_none() =>
            {
                Err(ErrorWithStatusCode::new(401))
            }
            _ if new_password.is_none() => Ok(None),
            _ => Ok(Some(super::creds::CredentialsConfig::new(
                &new_password.unwrap(),
            ))),
        },
        &state.conn,
    )
    .await??;

    Ok(Output {
        token: credentials.map(|c| c.sign()),
    })
}
