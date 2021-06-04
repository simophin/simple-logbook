use chrono::NaiveDate;

use crate::sqlx_ext::Json;

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub name: String,
    pub balance: i64,
    pub last_trans_date: NaiveDate,
}

#[derive(serde::Deserialize)]
pub struct Input {
    q: Option<String>,
    includes: Option<Json<Vec<String>>>,
}

//language=sql
const SQL: &str = r#"
select *
from accounts
where (?1 is null or trim(?1) = '' or name like '%' || trim(?1) || '%' collate nocase)
  and (?2 is null or name in (select value from json_each(?2)))
"#;

crate::list_sql_impl!(Input, Account, query_as, SQL, q, includes);
