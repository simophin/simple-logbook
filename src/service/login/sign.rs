use serde_derive::*;

use super::creds::*;
use crate::service::{Error, Result};
use crate::state::AppState;

#[derive(Deserialize)]
pub struct Input {
    password: String,
}

#[derive(Serialize)]
pub struct Output {
    token: String,
}

pub async fn execute(state: &AppState, input: Input) -> Result<Output> {
    let c: CredentialsConfig =
        crate::service::config::get_json(CREDENTIALS_CONFIG_KEY, None, &state.conn)
            .await?
            .ok_or_else(|| anyhow::anyhow!("No credentials set"))?;

    if c.verify_password(&input.password).is_none() {
        return Err(Error::InvalidCredentials);
    }

    Ok(Output {
        token: c.sign_token().to_string(),
    })
}
