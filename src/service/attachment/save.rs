use anyhow::Context;
use axum::{
    extract::{Multipart, State},
    Json,
};
use serde_derive::Serialize;
use std::borrow::Cow;

use crate::state::AppState;

pub struct Input<'a> {
    pub mime_type: Option<Cow<'a, str>>,
    pub data: &'a [u8],
    pub name: Cow<'a, str>,
}

#[derive(Serialize)]
pub struct Output {
    pub id: String,
}

pub async fn save(
    state: &AppState,
    mime_type: Option<&str>,
    data: &[u8],
    name: &str,
) -> crate::service::Result<String> {
    let hash_code = sodiumoxide::crypto::hash::hash(&data);

    let mut tx = state.conn.begin().await?;

    let row: Option<(String, Vec<u8>)> =
        sqlx::query_as("SELECT id, data FROM attachments WHERE dataHash = ?")
            .bind(hash_code.as_ref())
            .fetch_optional(&mut *tx)
            .await?;

    match row {
        Some((existing_id, existing_data)) if existing_data == data => {
            return Ok(existing_id);
        }
        _ => {}
    }

    let mime_type = match mime_type {
        Some(v) if v != "application/octet-stream" => Cow::Borrowed(v),
        _ => Cow::from(tree_magic::from_u8(data)),
    };

    let id = uuid::Uuid::new_v4().as_hyphenated().to_string();
    sqlx::query(
        "INSERT INTO attachments (id, mimeType, name, lastUpdated, dataHash, data) \
                VALUES (?, ?, ?, current_timestamp, ?, ?)",
    )
    .bind(&id)
    .bind(mime_type.as_ref())
    .bind(name)
    .bind(hash_code.as_ref())
    .bind(data)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(id)
}

pub async fn execute(
    state: State<AppState>,
    mut multipart: Multipart,
) -> crate::service::Result<Json<Vec<Output>>> {
    let mut outputs = vec![];
    while let Some(field) = multipart.next_field().await? {
        let content_type = field.content_type().map(|v| v.to_string());
        let file_name = field.file_name().context("Must have a name")?.to_string();

        let id = save(
            &state,
            content_type.as_deref(),
            field.bytes().await?.as_ref(),
            &file_name,
        )
        .await?;

        outputs.push(Output { id });
    }

    Ok(outputs.into())
}
