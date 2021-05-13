use serde_derive::*;

use super::creds::*;
use crate::service::ErrorWithStatusCode;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct Input {
    password: String,
}

#[derive(Serialize)]
pub struct Output {
    token: String,
}

pub async fn execute(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let c: CredentialsConfig = crate::config::get(CREDENTIALS_CONFIG_KEY, None, &state.conn)
        .await?
        .ok_or_else(|| anyhow::anyhow!("No credentials set"))?;

    if c.verify_password(&input.password).is_none() {
        return Err(ErrorWithStatusCode::new(401).into());
    }

    Ok(Output { token: c.sign() })
}
