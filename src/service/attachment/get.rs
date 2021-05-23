use std::borrow::Cow;

use chrono::{DateTime, Utc};
use serde_derive::*;

use crate::service::error::map_to_std;
use crate::service::Error;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct Input<'a> {
    pub id: Cow<'a, str>,
}

#[derive(sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct Output {
    pub mime_type: String,
    pub last_updated: DateTime<Utc>,
    pub created: DateTime<Utc>,
    pub data: Vec<u8>,
    pub data_hash: Vec<u8>,
}

pub async fn execute(state: &AppState, Input { id }: Input<'_>) -> crate::service::Result<Output> {
    sqlx::query_as(
        "SELECT mimeType, created, lastUpdated, dataHash, data FROM attachments WHERE id = ?",
    )
    .bind(id.into_owned())
    .fetch_optional(&state.conn)
    .await
    .map_err(map_to_std)?
    .ok_or(Error::ResourceNotFound)
}
