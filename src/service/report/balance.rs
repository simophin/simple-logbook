use crate::sqlx_ext::Json;
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

//language=sql
const SQL: &str = r#"
with recursive input_accounts(name) as (select value from json_each(?3)),
               daily(date, total, i) as (select transDate, sum(ds.total), row_number() over (order by transDate)
                                               from daily_sum ds
                                                        inner join input_accounts ia on ia.name = ds.account
                                               where ?1 is null or transDate >= ?1
                                                 and ?2 is null or transDate <= ?2
                                               group by transDate
                                               order by transDate),
               balance(balanceDate, i, balance) as (
                   select daily.date, 1, coalesce(sum(at.amount), 0)
                   from account_transactions at
                            inner join daily on daily.i = 1
                            inner join input_accounts ia on ia.name = at.account
                   where transDate <= daily.date

                   union all

                   select daily.date, balance.i + 1, balance.balance + daily.total
                   from balance
                   inner join daily on daily.i = balance.i + 1
               )
select balanceDate `date`, balance
from balance
where `date` is not null
"#;

crate::list_sql_impl!(Input, DataRow, query_as, SQL, from, to, accounts);
