use std::borrow::Cow;

use bytes::Bytes;

use crate::service::error::map_to_std;
use crate::state::AppState;

pub struct Input<'a> {
    pub mime_type: Option<Cow<'a, str>>,
    pub data: Bytes,
    pub name: Cow<'a, str>,
}

#[derive(serde::Serialize)]
pub struct Output {
    pub id: String,
}

pub async fn execute(
    state: &AppState,
    Input {
        mime_type,
        data,
        name,
    }: Input<'_>,
) -> crate::service::Result<Output> {
    let hash_code = sodiumoxide::crypto::hash::hash(&data);

    let mut tx = state.conn.begin().await.map_err(map_to_std)?;

    let row: Option<(String, Vec<u8>)> =
        sqlx::query_as("SELECT id, data FROM attachments WHERE dataHash = ?")
            .bind(hash_code.as_ref())
            .fetch_optional(&mut tx)
            .await
            .map_err(map_to_std)?;

    match row {
        Some((existing_id, existing_data)) if existing_data == data => {
            return Ok(Output { id: existing_id });
        }
        _ => {}
    }

    let mime_type = match mime_type {
        Some(v) if v.as_ref() != "application/octet-stream" => v,
        _ => Cow::from(tree_magic::from_u8(data.as_ref())),
    };

    let id = uuid::Uuid::new_v4().to_hyphenated().to_string();
    sqlx::query(
        "INSERT INTO attachments (id, mimeType, name, lastUpdated, dataHash, data) \
                VALUES (?, ?, ?, current_timestamp, ?, ?)",
    )
    .bind(&id)
    .bind(mime_type.as_ref())
    .bind(name.as_ref())
    .bind(hash_code.as_ref())
    .bind(data.as_ref())
    .execute(&mut tx)
    .await
    .map_err(map_to_std)?;

    tx.commit().await.map_err(map_to_std)?;

    Ok(Output { id })
}
