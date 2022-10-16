use std::borrow::Cow;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::{
    bind_sqlite_args,
    service::{self, query::create_paginated_query, PaginatedResponse, Result, SortOrder, ToSQL},
    state::AppState,
};

#[derive(Deserialize, Clone, Copy, Debug)]
#[serde(rename_all = "camelCase")]
enum SortField {
    Tag,
    NumTx,
    Total,
    LastUpdated,
}

type Sort = service::Sort<SortField>;

#[derive(Deserialize, Default)]
pub struct Input {
    #[serde(default = "default_sorts")]
    sorts: Cow<'static, [Sort]>,

    #[serde(default = "default_limit")]
    limit: i64,
    #[serde(default)]
    offset: i64,
    q: Option<String>,
}

const DEFAULT_SORTS: &[Sort] = &[
    Sort::new(SortField::Tag, SortOrder::ASC),
    Sort::new(SortField::NumTx, SortOrder::DESC),
];

const fn default_sorts() -> Cow<'static, [Sort]> {
    return Cow::Borrowed(DEFAULT_SORTS);
}

const fn default_limit() -> i64 {
    50
}

impl ToSQL for SortField {
    fn to_sql(&self) -> Option<&str> {
        Some(match self {
            SortField::Tag => "tag",
            SortField::NumTx => "numTx",
            SortField::Total => "total",
            SortField::LastUpdated => "lastUpdated",
        })
    }
}

#[derive(Serialize, FromRow, Debug, Clone)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    tag: String,
    num_tx: i64,
    total: i64,
    last_updated: DateTime<Utc>,
}

//language=sql
const SQL: &str = r#"
select tag, count(transactionId) as numTx, sum(amount) as total, max(t.updatedDate) as lastUpdated
from transaction_tags
inner join transactions t on t.id = transactionId
where (?1 is null or trim(?1) = '' or tag like '%' || trim(?1) || '%' collate nocase)
group by tag
"#;

pub async fn execute(
    state: &AppState,
    Input {
        sorts,
        limit,
        offset,
        q,
    }: Input,
) -> Result<PaginatedResponse<Tag>> {
    let (data, (total,)) = create_paginated_query(
        &state.conn,
        SQL,
        bind_sqlite_args!(q),
        limit,
        offset,
        sorts,
        "COUNT(*)",
    )
    .await?;
    Ok(PaginatedResponse { data, total })
}
