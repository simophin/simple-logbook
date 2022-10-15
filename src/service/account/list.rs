use crate::service::{Sort, SortOrder, WithOrder};
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
    sorts: Option<Vec<Sort<'static>>>,
}

const DEFAULT_SORTS: &'static [Sort] = &[Sort::new("lastTransDate", SortOrder::DESC)];

impl WithOrder for Input {
    fn get_sorts(&self) -> &[Sort<'_>] {
        self.sorts.as_ref().map(|v| v.as_ref()).unwrap_or_default()
    }

    fn get_default_sorts(&self) -> &[Sort<'_>] {
        DEFAULT_SORTS
    }

    fn map_to_db(input: &str) -> Option<&str> {
        match input {
            "name" | "balance" | "lastTransDate" => Some(input),
            _ => None,
        }
    }
}

//language=sql
const SQL: &str = r#"
select *
from accounts
where (?1 is null or trim(?1) = '' or name like '%' || trim(?1) || '%' collate nocase)
  and (?2 is null or name in (select value from json_each(?2)) collate nocase)
"#;

crate::list_sql_with_sort_impl!(Input, Account, query_as, SQL, q, includes);
