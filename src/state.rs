use sqlx::AnyPool;

#[derive(Clone)]
pub struct AppState {
    pub conn: AnyPool,
}

#[cfg(test)]
impl AppState {
    pub async fn new_test() -> AppState {
        let conn = sqlx::AnyPool::connect("sqlite::memory:").await.unwrap();
        sqlx::migrate!().run(&conn).await.expect("Migration to run");
        AppState { conn }
    }
}
