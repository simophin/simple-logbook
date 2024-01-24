use axum::{routing::post, Router};

use crate::state::AppState;

mod list;

pub fn router() -> Router<AppState> {
    Router::new().route("/api/tags/list", post(list::execute))
}
