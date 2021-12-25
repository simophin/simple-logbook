use crate::service::Error;
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
        Some(config) if config.verify_token(&input.token).is_none() => Ok(false),
        Some(_) => Ok(true),
        None => Err(Error::InvalidCredentials),
    }
}
