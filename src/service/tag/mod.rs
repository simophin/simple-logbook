use axum::{routing::get, Router};

use crate::state::AppState;

mod list;

pub fn router() -> Router<AppState> {
    Router::new().route("/api/tags", get(list::execute))
}
