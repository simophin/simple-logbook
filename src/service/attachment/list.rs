use serde::*;
use std::borrow::Cow;

use crate::service::error::map_to_std;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct Input<'a> {
    pub ids: Vec<Cow<'a, str>>,
}

pub async fn execute(
    state: &AppState,
    Input { ids }: Input<'_>,
) -> crate::service::Result<Vec<super::model::AttachmentSummary>> {
    if ids.is_empty() {
        return Ok(vec![]);
    }

    sqlx::query_as(include_str!("list.sql"))
        .bind(serde_json::to_string(&ids).unwrap())
        .fetch_all(&state.conn)
        .await
        .map_err(map_to_std)
}
