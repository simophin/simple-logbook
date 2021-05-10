use super::creds::*;
use crate::state::AppState;

use serde_derive::*;

pub type Input = ();

#[derive(Serialize)]
pub struct Output {
    token: String,
}

pub async fn execute(state: &AppState, _: Input) -> anyhow::Result<Output> {
    let c: CredentialsConfig = crate::config::get(CREDENTIALS_CONFIG_KEY, &state.conn)
        .await?
        .ok_or_else(|| anyhow::anyhow!("No credentials set"))?;

    Ok(Output { token: c.sign() })
}
