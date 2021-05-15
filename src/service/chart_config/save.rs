use super::super::Result;
use crate::state::AppState;
use serde_derive::*;
use std::borrow::Cow;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input<'a> {
    chart_name: Cow<'a, str>,
    chart_config: Cow<'a, str>,
}

pub type Output = ();

pub async fn execute(
    state: &AppState,
    Input {
        chart_name,
        chart_config,
    }: Input<'_>,
) -> Result<Output> {
    use crate::config;
    let _ = config::update::<_, (), _>(
        super::CONFIG_NAME,
        Some(chart_name.as_ref()),
        |_| Ok(Some(chart_config)),
        &state.conn,
    )
    .await?;

    Ok(())
}
