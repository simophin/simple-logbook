use std::borrow::Cow;

use crate::{
    service,
    service::{display_sorts_sql, Result, SortOrder, ToSQL},
    state::AppState,
};
use chrono::NaiveDate;

use crate::sqlx_ext::Json;

type Sort = service::Sort<SortField>;

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
    #[serde(default = "default_sorts")]
    sorts: Cow<'static, [Sort]>,
}

#[derive(serde::Deserialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
enum SortField {
    Name,
    Balance,
    LastTransDate,
}

const DEFAULT_SORTS: &'static [Sort] = &[Sort {
    field: SortField::LastTransDate,
    order: SortOrder::DESC,
}];

const fn default_sorts() -> Cow<'static, [Sort]> {
    return Cow::Borrowed(DEFAULT_SORTS);
}

impl ToSQL for SortField {
    fn to_sql(&self) -> Option<&str> {
        Some(match self {
            SortField::Name => "name",
            SortField::Balance => "balance",
            SortField::LastTransDate => "lastTransDate",
        })
    }
}

//language=sql
const SQL: &str = r#"
select *
from accounts
where (?1 is null or trim(?1) = '' or name like '%' || trim(?1) || '%' collate nocase)
  and (?2 is null or name in (select value from json_each(?2)) collate nocase)
"#;

pub async fn execute(state: &AppState, req: Input) -> Result<Vec<Account>> {
    let Input { q, includes, sorts } = req;
    let sql = format!(
        "with cte as({SQL}) select * from cte {order}",
        order = display_sorts_sql(sorts)
    );

    Ok(sqlx::query_as(&sql)
        .bind(q)
        .bind(includes)
        .fetch_all(&state.conn)
        .await?)
}
