use std::ops::DerefMut;

#[allow(unused)]
pub async fn with_temp_values<IN>(
    pool: &sqlx::SqlitePool,
    input: impl Iterator<Item = IN>,
) -> sqlx::Result<sqlx::Transaction<'static, sqlx::Sqlite>>
where
    for<'c> IN: sqlx::Type<sqlx::Sqlite> + sqlx::Encode<'c, sqlx::Sqlite> + Send,
{
    let mut tx = pool.begin().await?;

    use sqlx::TypeInfo;
    let sql = format!(
        "CREATE TEMPORARY TABLE temp_values (value {} NOT NULL)",
        <IN as sqlx::Type<sqlx::Sqlite>>::type_info().name()
    );
    let _ = sqlx::query(&sql).execute(tx.deref_mut()).await?;
    for v in input {
        let _ = sqlx::query("INSERT INTO temp_values (value) VALUES (?)")
            .bind(v)
            .execute(tx.deref_mut())
            .await?;
    }

    Ok(tx)
}
