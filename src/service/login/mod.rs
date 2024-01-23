pub mod creds;
mod refresh;
mod sign;
mod update;
pub mod verify;

#[cfg(test)]
mod test;

use std::time::Duration;

use axum::{routing::post, Router};

use crate::state::AppState;
const DEFAULT_LOGIN_TOKEN_VALID_DURATION: Duration = Duration::from_secs(3600 * 12 * 10);

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/changePassword", post(update::execute))
        .route("/api/sign", post(sign::execute))
        .route("/api/refreshToken", post(refresh::execute))
}
