use serde_derive::*;

use crate::state::AppState;

use super::creds::*;

#[derive(Deserialize)]
pub struct Input<'a> {
    pub token: Signed<'a>,
}

pub type Output = bool;

pub async fn query(state: &AppState, input: Input<'_>) -> crate::service::Result<Output> {
    match CredentialsConfig::from_app(state).await {
        Some(config) if config.verify(&input.token).is_some() => Ok(true),
        None => Ok(true),
        _ => Ok(false),
    }
}
