use super::super::Result;
use crate::state::AppState;
use serde_derive::*;
use std::borrow::Cow;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input<'a> {
    chart_name: Cow<'a, str>,
}

#[derive(Serialize)]
pub struct Output {
    config: String,
}

pub async fn execute(state: &AppState, Input { chart_name }: Input<'_>) -> Result<Output> {
    use crate::config;
    let c: String = config::get(super::CONFIG_NAME, Some(chart_name.as_ref()), &state.conn)
        .await?
        .unwrap_or_default();
    Ok(Output { config: c })
}
