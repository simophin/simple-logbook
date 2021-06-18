use super::creds::*;
use crate::state::AppState;

use serde_derive::*;
use std::borrow::Cow;

#[derive(Deserialize)]
pub struct Input {}

#[derive(Serialize)]
pub struct Output {
    token: String,
}

pub async fn execute(state: &AppState, _: Input) -> crate::service::Result<Output> {
    let c: CredentialsConfig =
        crate::service::config::get_json(CREDENTIALS_CONFIG_KEY, None, &state.conn)
            .await?
            .ok_or_else(|| {
                crate::service::Error::InvalidArgument(Cow::from("No credentials found"))
            })?;

    Ok(Output { token: c.sign() })
}
