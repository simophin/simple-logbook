use axum::{extract::DefaultBodyLimit, routing::post, Router};

use crate::state::AppState;

pub mod get;
pub mod list;
pub mod save;
pub mod sign;

pub mod cleanup;

#[cfg(test)]
pub mod test;

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/attachments",
            post(save::execute).layer(DefaultBodyLimit::max(20 * 1024 * 1024)),
        )
        .route("/api/attachments/list", post(list::execute))
        .route("/attachment/:token", axum::routing::get(get::execute))
}
