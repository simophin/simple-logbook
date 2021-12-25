use super::list::AttachmentSigned;
use std::borrow::Cow;

use crate::state::AppState;

pub struct Input<'a> {
    pub mime_type: Option<Cow<'a, str>>,
    pub data: &'a [u8],
    pub name: Cow<'a, str>,
}

pub async fn execute(
    state: &AppState,
    Input {
        mime_type,
        data,
        name,
    }: Input<'_>,
) -> crate::service::Result<AttachmentSigned> {
    let hash_code = sodiumoxide::crypto::hash::hash(&data);

    let mut tx = state.conn.begin().await?;

    let row: Option<(String, Vec<u8>)> =
        sqlx::query_as("SELECT id, data FROM attachments WHERE dataHash = ?")
            .bind(hash_code.as_ref())
            .fetch_optional(&mut tx)
            .await?;

    match row {
        Some((existing_id, existing_data)) if existing_data == data => {
            return Ok(Output { id: existing_id });
        }
        _ => {}
    }

    let mime_type = match mime_type {
        Some(v) if v.as_ref() != "application/octet-stream" => v,
        _ => Cow::from(tree_magic::from_u8(data)),
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
    .bind(data)
    .execute(&mut tx)
    .await?;

    tx.commit().await?;

    Ok(Output { id })
}
