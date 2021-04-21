use sqlx::SqlitePool;

#[derive(Clone)]
pub struct AppState {
    pub conn: SqlitePool,
}
