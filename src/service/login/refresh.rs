use super::creds::*;
use crate::state::AppState;

use serde_derive::*;

#[derive(Deserialize)]
pub struct Input {}

#[derive(Serialize)]
pub struct Output {
    token: String,
}

pub async fn execute(state: &AppState, _: Input) -> anyhow::Result<Output> {
    let c: CredentialsConfig = crate::config::get(CREDENTIALS_CONFIG_KEY, None, &state.conn)
        .await?
        .ok_or_else(|| anyhow::anyhow!("No credentials set"))?;

    Ok(Output { token: c.sign() })
}
