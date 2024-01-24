use super::creds::*;
use crate::state::AppState;

use super::DEFAULT_LOGIN_TOKEN_VALID_DURATION;
use axum::{extract::State, Json};
use serde_derive::*;
use std::borrow::Cow;

#[derive(Serialize)]
pub struct Output {
    token: Signed<'static>,
}

pub async fn execute(state: State<AppState>) -> crate::service::Result<Json<Output>> {
    let c = CredentialsConfig::from_app(&state)
        .await
        .ok_or_else(|| crate::service::Error::InvalidArgument(Cow::from("No credentials found")))?;

    Ok(Output {
        token: c.sign(&Asset::new(DEFAULT_LOGIN_TOKEN_VALID_DURATION, None, None)),
    }
    .into())
}
