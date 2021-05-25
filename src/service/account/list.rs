use super::models::Account;
use crate::service::error::map_to_std;
use crate::state::AppState;
use serde_derive::*;

#[derive(Deserialize)]
pub struct Input {
    q: Option<String>,
    includes: Option<Vec<String>>,
}

pub type Output = Vec<Account>;

pub async fn execute(state: &AppState, Input { q, includes }: Input) -> anyhow::Result<Output> {
    let includes = includes.map(|v| serde_json::to_string(&v).unwrap());
    let output = sqlx::query_as(include_str!("list.sql"))
        .bind(q)
        .bind(includes)
        .fetch_all(&state.conn)
        .await
        .map_err(map_to_std)?;
    Ok(output)
}
