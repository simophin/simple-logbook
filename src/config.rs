use serde::de::DeserializeOwned;
use serde::Serialize;
use sqlx::SqlitePool;

pub async fn get<T>(key: &str, id: Option<&str>, conn: &SqlitePool) -> anyhow::Result<Option<T>>
where
    T: DeserializeOwned,
{
    let id = id.unwrap_or("");
    let value: Option<(String,)> =
        sqlx::query_as("SELECT value FROM configs WHERE name = ? AND id = ?")
            .bind(key)
            .bind(id)
            .fetch_optional(conn)
            .await?;

    match value {
        Some(v) => Ok(serde_json::from_str(&v.0)?),
        None => Ok(None),
    }
}

pub async fn update<T, E, F>(
    key: &str,
    id: Option<&str>,
    updater: F,
    conn: &SqlitePool,
) -> anyhow::Result<Result<Option<T>, E>>
where
    T: DeserializeOwned + Serialize,
    F: FnOnce(Option<T>) -> Result<Option<T>, E>,
{
    let mut tx = conn.begin().await?;
    let id = id.unwrap_or("");

    let value: Option<(String,)> =
        sqlx::query_as("SELECT value FROM configs WHERE name = ? AND id = ?")
            .bind(key)
            .bind(id)
            .fetch_optional(&mut tx)
            .await?;

    let value: Option<T> = match value {
        Some(v) => Some(serde_json::from_str(&v.0)?),
        None => None,
    };

    match updater(value) {
        Ok(Some(value)) => {
            let _ =
                sqlx::query("INSERT OR REPLACE INTO configs (name, id, value) VALUES (?, ?, ?)")
                    .bind(key)
                    .bind(id)
                    .bind(serde_json::to_string(&value)?)
                    .execute(&mut tx)
                    .await?;
            tx.commit().await?;
            Ok(Ok(Some(value)))
        }
        Ok(None) => {
            let _ = sqlx::query("DELETE FROM configs WHERE name = ? AND id = ?")
                .bind(key)
                .bind(id)
                .execute(&mut tx)
                .await?;
            tx.commit().await?;
            Ok(Ok(None))
        }
        Err(e) => Ok(Err(e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::AppState;

    #[async_std::test]
    async fn config_rw_works() {
        let AppState { conn } = AppState::new_test().await;

        #[derive(Clone)]
        struct TestData {
            name: &'static str,
            id: Option<&'static str>,
            value: Option<&'static str>,
        }

        let test_data = vec![
            TestData {
                name: "config",
                id: None,
                value: Some("value_without_id"),
            },
            TestData {
                name: "other_config_without_id",
                id: None,
                value: Some("other_value_without_id"),
            },
            TestData {
                name: "config",
                id: Some("1"),
                value: Some("value_with_id_1"),
            },
            TestData {
                name: "config",
                id: Some("2"),
                value: Some("value_with_id_2"),
            },
            TestData {
                name: "other_config",
                id: Some("2"),
                value: Some("other_value_with_id_2"),
            },
        ];

        // Test update and read
        for TestData { name, id, value } in test_data.clone() {
            let value = value.map(|v| v.to_string());
            assert_eq!(get::<String>(name, id, &conn).await.unwrap(), None);

            let updated = update::<String, (), _>(
                name,
                id,
                |v| {
                    assert_eq!(v, None);
                    Ok(value.clone())
                },
                &conn,
            )
            .await
            .unwrap()
            .unwrap();

            assert_eq!(updated, value);
            assert_eq!(get::<String>(name, id, &conn).await.unwrap(), value);
        }

        // Test deletion
        for TestData { name, id, value } in test_data.clone() {
            let value = value.map(|v| v.to_string());
            let updated = update::<String, (), _>(
                name,
                id,
                |v| {
                    assert_eq!(v, value);
                    Ok(None)
                },
                &conn,
            )
            .await
            .unwrap()
            .unwrap();

            assert_eq!(updated, None);
            assert_eq!(get::<String>(name, id, &conn).await.unwrap(), None);
        }
    }
}
