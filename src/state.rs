use sqlx::SqlitePool;

#[derive(Clone)]
pub struct AppState {
    pub conn: SqlitePool,
}

#[cfg(test)]
impl AppState {
    pub async fn new_test() -> AppState {
        let conn = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
        sqlx::migrate!().run(&conn).await.expect("Migration to run");
        AppState { conn }
    }
}
