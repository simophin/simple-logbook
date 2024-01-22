use axum::extract::{Request, State};
use axum::http::{Method, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::service::login::creds::Signed;
use crate::service::login::verify;
use crate::state::AppState;
use std::borrow::Cow;
use std::sync::Arc;

pub async fn execute(state: State<AppState>, request: Request, next: Next) -> Response {
    if !request.uri().path().starts_with("/api")
        || request.uri().path().starts_with("/api/sign")
        || request.method() == Method::OPTIONS
    {
        return next.run(request).await;
    }

    let token = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split("Bearer ").skip(1).next())
        .map(|v| Signed(Cow::from(v)))
        .unwrap_or_default();

    let verified = match verify::query(&state.0, verify::Input { token }).await {
        Ok(v) => v,
        Err(e) => return e.into_response(),
    };

    if verified {
        next.run(request).await
    } else {
        (StatusCode::UNAUTHORIZED, "Unauthorized").into_response()
    }
}
