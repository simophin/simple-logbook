use sqlx::AnyPool;

#[derive(Clone)]
pub struct AppState {
    pub conn: AnyPool,
}
