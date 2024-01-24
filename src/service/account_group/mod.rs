use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::state::AppState;

mod delete;
mod list;
mod models;
mod save;

#[cfg(test)]
mod test;

pub fn router() -> Router<AppState> {
    Router::new().nest(
        "/api/accountGroups",
        Router::new()
            .route("/", get(list::execute))
            .route("/", post(save::execute))
            .route("/", delete(delete::execute)),
    )
}
