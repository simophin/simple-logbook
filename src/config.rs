use serde::de::DeserializeOwned;
use serde::Serialize;
use sqlx::AnyPool;

pub async fn get<T>(key: &str, conn: &AnyPool) -> anyhow::Result<Option<T>>
where
    T: DeserializeOwned,
{
    let value: Option<(String,)> = sqlx::query_as("SELECT value FROM configs WHERE name = ?")
        .bind(key)
        .fetch_optional(conn)
        .await?;

    match value {
        Some(v) => Ok(serde_json::from_str(&v.0)?),
        None => Ok(None),
    }
}

pub async fn update<T, E, F>(
    key: &str,
    updater: F,
    conn: &AnyPool,
) -> anyhow::Result<Result<Option<T>, E>>
where
    T: DeserializeOwned + Serialize,
    F: FnOnce(Option<T>) -> Result<Option<T>, E>,
{
    let mut tx = conn.begin().await?;

    let value: Option<(String,)> = sqlx::query_as("SELECT value FROM configs WHERE name = ?")
        .bind(key)
        .fetch_optional(&mut tx)
        .await?;

    let value: Option<T> = match value {
        Some(v) => Some(serde_json::from_str(&v.0)?),
        None => None,
    };

    match updater(value) {
        Ok(Some(value)) => {
            let _ = sqlx::query("INSERT OR REPLACE INTO configs (name, value) VALUES (?, ?)")
                .bind(key)
                .bind(serde_json::to_string(&value)?)
                .execute(&mut tx)
                .await?;
            tx.commit().await?;
            Ok(Ok(Some(value)))
        }
        Ok(None) => {
            let _ = sqlx::query("DELETE FROM configs WHERE name = ?")
                .bind(key)
                .execute(&mut tx)
                .await?;
            tx.commit().await?;
            Ok(Ok(None))
        }
        Err(e) => Ok(Err(e)),
    }
}
