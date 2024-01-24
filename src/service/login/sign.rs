use axum::extract::State;
use axum::Json;
use serde_derive::*;

use super::creds::*;
use super::DEFAULT_LOGIN_TOKEN_VALID_DURATION;
use crate::service::{Error, Result};
use crate::state::AppState;

#[derive(Deserialize)]
pub struct Input {
    password: String,
}

#[derive(Serialize)]
pub struct Output {
    token: Signed<'static>,
}

pub async fn execute(
    state: State<AppState>,
    Json(Input { password }): Json<Input>,
) -> Result<Json<Output>> {
    CredentialsConfig::from_app(&state)
        .await
        .and_then(|c| {
            c.verify_password(&password).map(|_| Output {
                token: c.sign(&Asset::new(DEFAULT_LOGIN_TOKEN_VALID_DURATION, None, None)),
            })
        })
        .ok_or(Error::InvalidCredentials)
        .map(|o| o.into())
}
