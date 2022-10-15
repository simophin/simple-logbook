use chrono::{DateTime, Utc};
use derive_more::Deref;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::{
    bind_sqlite_args,
    service::{
        query::create_paginated_query, PaginatedResponse, Result, Sort, SortOrder, WithOrder,
    },
    state::AppState,
};

use super::super::CommonListRequest;

#[derive(Deserialize, Default, Deref)]
pub struct Input {
    #[serde(flatten)]
    #[deref]
    pub req: CommonListRequest,
}

const DEFAULT_SORTS: &[Sort] = &[
    Sort::new("tag", SortOrder::ASC),
    Sort::new("numTx", SortOrder::DESC),
];

impl WithOrder for Input {
    fn get_sorts(&self) -> &[Sort<'_>] {
        self.sorts.as_ref().map(|v| v.as_ref()).unwrap_or_default()
    }

    fn get_default_sorts(&self) -> &[Sort<'_>] {
        DEFAULT_SORTS
    }

    fn map_to_db(input: &str) -> Option<&str> {
        match input {
            "tag" | "numTx" | "total" | "lastUpdated" => Some(input),
            _ => None,
        }
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

pub async fn execute(state: &AppState, req: Input) -> Result<PaginatedResponse<Tag>> {
    let (data, (total,)) = create_paginated_query(
        &state.conn,
        SQL,
        bind_sqlite_args!(&req.q),
        req.limit,
        req.offset,
        Some(&req),
        "COUNT(*)",
    )
    .await?;
    Ok(PaginatedResponse { data, total })
}
