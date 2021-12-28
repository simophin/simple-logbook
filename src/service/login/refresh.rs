use super::creds::*;
use crate::state::AppState;

use super::DEFAULT_LOGIN_TOKEN_VALID_DURATION;
use serde_derive::*;
use std::borrow::Cow;

#[derive(Deserialize)]
pub struct Input {}

#[derive(Serialize)]
pub struct Output {
    token: Signed<'static>,
}

pub async fn execute(state: &AppState, _: Input) -> crate::service::Result<Output> {
    let c = CredentialsConfig::from_app(state)
        .await
        .ok_or_else(|| crate::service::Error::InvalidArgument(Cow::from("No credentials found")))?;

    Ok(Output {
        token: c.sign(&Asset::new(DEFAULT_LOGIN_TOKEN_VALID_DURATION, None, None)),
    })
}
