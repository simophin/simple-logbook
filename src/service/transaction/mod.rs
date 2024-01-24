use axum::{routing::post, Router};

use crate::state::AppState;

mod delete;
mod list;
pub mod model;
pub mod save;

#[cfg(test)]
pub mod test;

pub fn router() -> Router<AppState> {
    Router::new().nest(
        "/api/transactions",
        Router::new()
            .route("/", post(save::execute))
            .route("/", axum::routing::delete(delete::execute))
            .route("/list", post(list::execute)),
    )
}
