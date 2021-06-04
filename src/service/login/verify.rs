use serde_derive::*;

use super::creds::*;
use crate::state::AppState;
use std::borrow::Cow;

#[derive(Deserialize)]
pub struct Input<'a> {
    pub token: Cow<'a, str>,
}

pub type Output = bool;

pub async fn query(state: &AppState, input: Input<'_>) -> crate::service::Result<Output> {
    use crate::config;
    let c: Option<CredentialsConfig> =
        config::get(CREDENTIALS_CONFIG_KEY, None, &state.conn).await?;
    match c {
        Some(config) if config.verify_token(&input.token).is_none() => Ok(false),
        _ => Ok(true),
    }
}
