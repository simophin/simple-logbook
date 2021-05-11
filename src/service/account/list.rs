use super::models::Account;
use crate::state::AppState;
use itertools::Itertools;
use serde_derive::*;

#[derive(Deserialize)]
pub struct Input {
    q: Option<String>,
    includes: Option<Vec<String>>,
}

pub type Output = Vec<Account>;

pub async fn execute(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let mut sql = "SELECT * FROM accounts WHERE 1".to_string();
    let mut binds = Vec::new();

    let Input { q, includes } = input;

    if let Some(q) = q {
        sql += " AND name LIKE '%' || ? || '%'";
        binds.push(q);
    }

    if let Some(names) = includes {
        sql += " AND name IN (";
        sql += &(0..names.len()).map(|_| "?").join(",");
        sql += ")";
        binds.extend_from_slice(&names);
    }

    let accounts: Output = binds
        .into_iter()
        .fold(sqlx::query_as(&sql), |q, a| q.bind(a))
        .fetch_all(&state.conn)
        .await?;

    Ok(accounts)
}
