use serde::Serialize;
use serde_derive::*;

use crate::state::AppState;

use super::model::Transaction;
use crate::service::error::map_to_std;

type DateString = String;

#[derive(Deserialize)]
pub struct QueryInput {
    pub q: Option<String>,
    pub from: Option<DateString>,
    pub to: Option<DateString>,
    pub accounts: Option<Vec<String>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Serialize)]
pub struct Output {
    pub data: Vec<Transaction>,
    pub offset: i64,
    pub limit: i64,
    pub total: i64,
}

pub async fn execute(
    state: &AppState,
    QueryInput {
        q,
        from,
        to,
        accounts,
        limit,
        offset,
    }: QueryInput,
) -> crate::service::Result<Output> {
    let limit = limit.unwrap_or(50) as i64;
    let offset = offset.unwrap_or(0) as i64;
    let accounts = serde_json::to_string(&accounts.unwrap_or_default()).unwrap();

    let mut tx = state.conn.begin().await.map_err(map_to_std)?;

    let total: i64 = sqlx::query_scalar(include_str!("list_count.sql"))
        .bind(&q)
        .bind(&from)
        .bind(&to)
        .bind(&accounts)
        .fetch_one(&mut tx)
        .await
        .map_err(map_to_std)?;

    let data = sqlx::query_as(include_str!("list.sql"))
        .bind(&q)
        .bind(&from)
        .bind(&to)
        .bind(&accounts)
        .bind(offset)
        .bind(limit)
        .fetch_all(&mut tx)
        .await
        .map_err(map_to_std)?;

    Ok(Output {
        data,
        offset,
        limit,
        total,
    })
}
