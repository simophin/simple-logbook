use crate::service::ErrorWithStatusCode;
use crate::state::AppState;
use chrono::prelude::*;
use serde_derive::*;

#[derive(Deserialize)]
pub struct Input {
    from: Option<NaiveDate>,
    to: Option<NaiveDate>,
    accounts: Vec<String>,
}

#[derive(sqlx::FromRow, Serialize)]
#[sqlx(rename_all = "camelCase")]
pub struct DataRow {
    balance: i64,
    date: String,
}

pub type Output = Vec<DataRow>;

pub async fn execute(
    state: &AppState,
    Input { from, to, accounts }: Input,
) -> anyhow::Result<Output> {
    if accounts.is_empty() {
        return Ok(vec![]);
    }

    match (&from, &to) {
        (Some(a), Some(b)) if a > b => return Err(ErrorWithStatusCode::new(400).into()),
        _ => {}
    }

    let from = from
        .map(|t| t.to_string())
        .unwrap_or_else(|| String::from("1970-01-01"));
    let to = to
        .map(|t| t.to_string())
        .unwrap_or_else(|| String::from("2999-12-12"));

    Ok(sqlx::query_as(include_str!("balance.sql"))
        .bind(from)
        .bind(to)
        .bind(serde_json::to_string(&accounts)?)
        .fetch_all(&state.conn)
        .await?)
}
