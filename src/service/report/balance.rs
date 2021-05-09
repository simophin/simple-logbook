use crate::state::AppState;
use chrono::prelude::*;
use serde_derive::*;

#[derive(Deserialize)]
pub struct Input {
    from: NaiveDate,
    to: NaiveDate,
    accounts: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataPoint {
    balance: i64,
    date: String,
}

#[derive(sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
struct DataRow {
    balance: i64,
    balance_date: String,
    account: String,
}

#[derive(Serialize)]
pub struct Series {
    account: String,
    data: Vec<DataPoint>,
}

pub type Output = Vec<Series>;

pub async fn query(
    state: &AppState,
    Input { from, to, accounts }: Input,
) -> anyhow::Result<Output> {
    if accounts.is_empty() {
        return Ok(vec![]);
    }

    let days = (to - from).num_days();
    if days < 0 {
        return Err(anyhow::anyhow!("To must be no earlier than from"));
    }

    let mut tx = state.conn.begin().await?;

    // Create temp table to insert account names
    let _ = sqlx::query(include_str!("balance_tmp_table.sql"))
        .execute(&mut tx)
        .await?;

    for acc in accounts {
        let _ = sqlx::query("insert into tmp_account_names (name) values (?)")
            .bind(acc)
            .execute(&mut tx)
            .await?;
    }

    // Prepare querying
    let rows: Vec<DataRow> = sqlx::query_as(include_str!("balance.sql"))
        .bind(from.to_string())
        .bind(days + 1)
        .fetch_all(&mut tx)
        .await?;

    let mut rs = Vec::<Series>::new();
    for DataRow {
        balance,
        balance_date,
        account,
    } in rows
    {
        let series = match rs.last_mut() {
            Some(s) if s.account == account => s,
            _ => {
                rs.push(Series {
                    account,
                    data: Vec::new(),
                });
                rs.last_mut().unwrap()
            }
        };

        series.data.push(DataPoint {
            balance,
            date: balance_date,
        })
    }

    Ok(rs)
}
