pub mod client;

use std::borrow::Cow;
use std::borrow::Cow::Owned;

use serde::de::DeserializeOwned;
use sqlx::SqlitePool;

pub async fn get(key: &str, id: Option<&str>, conn: &SqlitePool) -> anyhow::Result<Option<String>> {
    let id = id.unwrap_or("");
    let value: Option<(String,)> =
        sqlx::query_as("SELECT value FROM configs WHERE name = ? AND id = ?")
            .bind(key)
            .bind(id)
            .fetch_optional(conn)
            .await?;

    match value {
        Some((v,)) => Ok(Some(v)),
        None => Ok(None),
    }
}

pub async fn get_json<T>(
    key: &str,
    id: Option<&str>,
    conn: &SqlitePool,
) -> anyhow::Result<Option<T>>
where
    T: DeserializeOwned,
{
    Ok(match get(key, id, conn).await? {
        Some(v) => Some(serde_json::from_str(&v)?),
        None => None,
    })
}

pub async fn update<R, F>(
    key: &str,
    id: Option<&str>,
    updater: F,
    conn: &SqlitePool,
) -> anyhow::Result<R>
where
    for<'c> F: FnOnce(&mut Cow<'c, Option<String>>) -> R,
{
    let mut tx = conn.begin().await?;
    let id = id.unwrap_or("");

    //language=sql
    let value = sqlx::query_as("SELECT value FROM configs WHERE name = ? AND id = ?")
        .bind(key)
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?
        .map(|(v,): (String,)| v);

    let mut value = Cow::Borrowed(&value);

    let r = updater(&mut value);
    match value {
        Owned(Some(value)) => {
            //language=sql
            let _ =
                sqlx::query("INSERT OR REPLACE INTO configs (name, id, value) VALUES (?, ?, ?)")
                    .bind(key)
                    .bind(id)
                    .bind(&value)
                    .execute(&mut *tx)
                    .await?;
            tx.commit().await?;
        }
        Owned(None) => {
            //language=sql
            let _ = sqlx::query("DELETE FROM configs WHERE name = ? AND id = ?")
                .bind(key)
                .bind(id)
                .execute(&mut *tx)
                .await?;
            tx.commit().await?;
        }
        _ => {}
    };

    Ok(r)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::AppState;

    #[tokio::test]
    async fn config_rw_works() {
        let AppState { conn, .. } = AppState::new_test().await;

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
            assert_eq!(get(name, id, &conn).await.unwrap(), None);

            let updated = update(
                name,
                id,
                |v| {
                    assert_eq!(*v.as_ref(), None);
                    *v = Cow::Owned(value.clone());
                    value.clone()
                },
                &conn,
            )
            .await
            .unwrap();

            assert_eq!(updated, value);
            assert_eq!(get(name, id, &conn).await.unwrap(), value);
        }

        // Test deletion
        for TestData { name, id, value } in test_data.clone() {
            let value = value.map(|v| v.to_string());
            let updated: Option<String> = update(
                name,
                id,
                |v| {
                    assert_eq!(*v.as_ref(), value);
                    *v = Cow::Owned(None);
                    None
                },
                &conn,
            )
            .await
            .unwrap();

            assert_eq!(updated, None);
            assert_eq!(get(name, id, &conn).await.unwrap(), None);
        }
    }
}
