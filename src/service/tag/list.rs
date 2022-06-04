use derive_more::Deref;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::service::{Sort, SortOrder, WithOrder};

use super::super::CommonListRequest;

#[derive(Deserialize, Default, Deref)]
pub struct Input {
    #[serde(flatten)]
    #[deref]
    pub req: CommonListRequest,
}

const DEFAULT_SORTS: &[Sort] = &[
    Sort::new("name", SortOrder::ASC),
    Sort::new("numTx", SortOrder::DESC),
];

impl WithOrder for Input {
    fn get_sorts(&self) -> &Option<Vec<Sort>> {
        &self.sorts
    }

    fn get_default_sorts() -> &'static [Sort] {
        DEFAULT_SORTS
    }

    fn map_to_db(input: &str) -> Option<&'static str> {
        match input {
            "tag" => Some("tag"),
            "numTx" => Some("numTx"),
            "total" => Some("total"),
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
}

//language=sql
const COUNT_SQL: &str = r#"
select count(distinct tag)
from transaction_tags
where (?1 is null or trim(?1) = '' or tag like '%' || trim(?1) || '%' collate nocase)
"#;

//language=sql
const SQL: &str = r#"
select tag, count(transactionId) as numTx, sum(amount) as total
from transaction_tags
inner join transactions t on t.id = transactionId
where (?1 is null or trim(?1) = '' or tag like '%' || trim(?1) || '%' collate nocase)
group by tag
"#;

crate::list_sql_paginated_impl!(Input, Tag, query_as, SQL, COUNT_SQL, offset, limit, q);
