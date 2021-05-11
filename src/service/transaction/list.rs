use itertools::Itertools;
use serde::Serialize;
use serde_derive::*;

use crate::state::AppState;

use super::models::Transaction;

type DateString = String;

#[derive(Deserialize)]
pub struct QueryInput {
    q: Option<String>,
    from: Option<DateString>,
    to: Option<DateString>,
    accounts: Option<Vec<String>>,
    limit: Option<usize>,
    offset: Option<usize>,
}

#[derive(Serialize)]
pub struct QueryOutput {
    data: Vec<Transaction>,
    offset: usize,
    limit: usize,
    total: usize,
}

pub async fn execute(state: &AppState, params: QueryInput) -> anyhow::Result<QueryOutput> {
    let mut binds = Vec::with_capacity(6);
    let QueryInput {
        q,
        from,
        to,
        accounts,
        limit,
        offset,
    } = params;

    let mut cond = String::from("1");

    if let Some(accounts) = accounts {
        let bind_index_start = binds.len() + 1;
        let acc_sql_frag = (bind_index_start..bind_index_start + accounts.len())
            .map(|i| format!("?{}", i))
            .join(",");

        for account in accounts {
            binds.push(account);
        }

        cond += &format!(
            " AND (t.fromAccount IN ({}) COLLATE NOCASE OR t.toAccount IN ({})) COLLATE NOCASE",
            &acc_sql_frag, &acc_sql_frag
        );
    }

    if let Some(v) = from {
        cond += &format!(" AND t.transDate >= ?{}", binds.len() + 1);
        binds.push(v);
    }

    if let Some(v) = to {
        cond += &format!(" AND t.transDate <= ?{}", binds.len() + 1);
        binds.push(v);
    }

    if let Some(q) = q {
        cond += &format!(
            " AND t.description LIKE ('%' || ?{} || '%') COLLATE NOCASE",
            binds.len() + 1
        );
        binds.push(q);
    }

    let limit = limit.unwrap_or(10);
    let offset = offset.unwrap_or(0);

    let mut tx = state.conn.begin().await?;

    // Count the query
    let num_total: i64 = binds
        .iter()
        .fold(
            sqlx::query_scalar(&format!(
                "SELECT COUNT(t.id) FROM transactions t WHERE {}",
                &cond
            )),
            |q, i| q.bind(i),
        )
        .fetch_one(&mut tx)
        .await?;

    // Run the real query
    let data = binds.into_iter()
        .fold(sqlx::query_as(&format!(
            "SELECT t.* FROM transactions t WHERE {} ORDER BY t.transDate DESC, t.updatedDate DESC LIMIT {}, {}",
            &cond, offset, limit
        )), |q, i| q.bind(i))
        .fetch_all(&mut tx).await?;

    let _ = tx.commit().await;

    Ok(QueryOutput {
        data,
        limit,
        offset,
        total: num_total as usize,
    })
}
