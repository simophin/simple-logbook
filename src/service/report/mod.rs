use axum::{routing::post, Router};

use crate::state::AppState;

mod balance;
mod sum;

#[derive(serde::Deserialize, sqlx::Type)]
enum Frequency {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

pub fn router() -> Router<AppState> {
    Router::new().nest(
        "/api/reports",
        Router::new()
            .route("/balance", post(balance::execute))
            .route("/sum", post(sum::execute)),
    )
}
