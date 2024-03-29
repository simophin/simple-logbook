use crate::{service::Result, sqlx_ext::Json, state::AppState};
use axum::extract;
use chrono::NaiveDate;

#[derive(serde::Deserialize)]
pub struct Input {
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    pub accounts: Json<Vec<String>>,
}

#[derive(sqlx::FromRow, serde::Serialize)]
#[sqlx(rename_all = "camelCase")]
pub struct DataRow {
    pub balance: i64,
    pub date: NaiveDate,
}

const SQL: &'static str = r#"
with recursive 
    input_accounts(name) as (select trim(value) from json_each(?3)),
    daily(date, total, i) as (
        select transDate, sum(ds.total), row_number() over (order by transDate)
        from daily_sum ds
        inner join input_accounts ia on ia.name = ds.account collate nocase
        where ?1 is null or transDate >= ?1 and ?2 is null or transDate <= ?2
        group by transDate
        order by transDate
    ),
    balance(balanceDate, i, balance) as (
        select daily.date, 1, coalesce(sum(at.amount), 0)
        from account_transactions at
        inner join daily on daily.i = 1
        inner join input_accounts ia on ia.name = at.account collate nocase
        where transDate <= daily.date

        union all

        select daily.date, balance.i + 1, balance.balance + daily.total
        from balance
        inner join daily on daily.i = balance.i + 1
    )
select balanceDate date, balance
from balance
"#;

pub async fn execute(
    state: extract::State<AppState>,
    extract::Json(Input { from, to, accounts }): extract::Json<Input>,
) -> Result<extract::Json<Vec<DataRow>>> {
    Ok(sqlx::query_as(SQL)
        .bind(from)
        .bind(to)
        .bind(accounts)
        .fetch_all(&state.conn)
        .await?
        .into())
}
