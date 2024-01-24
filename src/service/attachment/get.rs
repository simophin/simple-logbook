use std::borrow::Cow;
use std::io::Cursor;

use crate::service::login::creds::{CredentialsConfig, Signed};
use crate::service::Error;
use crate::utils::thumbnailer::generate_thumbnail;
use crate::AppState;
use anyhow::Context;
use axum::body::Body;
use axum::extract::{Path, Query, State};
use axum::response::Response;
use serde::Deserialize;

mod sql {
    use crate::service::Result;
    use crate::state::AppState;

    //language=sql
    const SQL: &str = r#"
        select data, mimeType
        from attachments
        where id = ?1
    "#;

    pub async fn execute(state: &AppState, id: &str) -> Result<Option<(Vec<u8>, String)>> {
        Ok(sqlx::query_as(SQL)
            .bind(id)
            .fetch_optional(&state.conn)
            .await?)
    }
}

pub async fn get(
    state: &AppState,
    signed_token: &str,
) -> crate::service::Result<(String, Vec<u8>)> {
    let signed = Signed(Cow::Borrowed(signed_token));
    let c = CredentialsConfig::from_app(&state).await;

    let id = match super::sign::verify(&signed, c.as_ref()) {
        Some(v) => v,
        _ => return Err(Error::InvalidCredentials),
    };

    match sql::execute(&state, &id).await {
        Ok(Some((data, mime_type))) => Ok((mime_type, data)),
        Ok(_) => Err(Error::ResourceNotFound),
        Err(e) => Err(e),
    }
}

#[derive(Deserialize)]
pub struct Input {
    preview: Option<usize>,
}

pub async fn execute(
    state: State<AppState>,
    Path((token,)): Path<(String,)>,
    Query(Input { preview }): Query<Input>,
) -> crate::service::Result<Response> {
    let (mime, data) = get(&state, &token).await?;

    if let Some(max_width) = preview {
        let (mime, data) = generate_thumbnail(max_width, Cursor::new(data)).await?;
        return Ok(Response::builder()
            .header("Content-Type", mime)
            .header("Cache-Control", "public, max-age=15552000")
            .body(Body::from_stream(data))
            .context("Creating response")?);
    }

    Ok(Response::builder()
        .header("Content-Type", mime)
        .header("Cache-Control", "public, max-age=15552000")
        .body(data.into())
        .context("Creating response")?)
}
