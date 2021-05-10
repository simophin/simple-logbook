use serde_derive::*;

use super::creds::*;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct Input {
    pub token: Option<String>,
}

pub type Output = bool;

pub async fn query(state: &AppState, input: Input) -> anyhow::Result<Output> {
    use crate::config;
    let c: Option<CredentialsConfig> = config::get(CREDENTIALS_CONFIG_KEY, &state.conn).await?;
    match c {
        Some(config)
            if config
                .verify_token(input.token.unwrap_or_default().as_ref())
                .is_none() =>
        {
            Ok(false)
        }
        _ => Ok(true),
    }
}
