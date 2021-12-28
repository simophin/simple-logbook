use super::model::Transaction;
use crate::service::{CommonListRequest, Sort, SortOrder, WithOrder};
use crate::sqlx_ext::Json;

#[derive(serde::Deserialize, Default)]
pub struct Input {
    #[serde(flatten)]
    pub req: CommonListRequest,

    pub accounts: Option<Json<Vec<String>>>,
}

const DEFAULT_SORTS: &[Sort] = &[
    Sort::new("created", SortOrder::DESC),
    Sort::new("updated", SortOrder::DESC),
];

impl WithOrder for Input {
    fn get_sorts(&self) -> &Vec<Sort> {
        &self.sorts
    }

    fn get_default_sorts() -> &'static [Sort] {
        DEFAULT_SORTS
    }

    fn map_to_db(input: &str) -> Option<&'static str> {
        match input {
            "fromAccount" => Some("fromAccount"),
            "toAccount" => Some("toAccount"),
            "created" => Some("transDate"),
            "updated" => Some("updatedDate"),
            _ => None,
        }
    }
}

crate::impl_deref!(Input, req, CommonListRequest);

//language=sql
const COUNT_SQL: &str = r#"
select count(t.id)
from transactions as t
where (?4 is null or trim(t.fromAccount) in (select value from json_each(?4)) or
       trim(t.toAccount) in (select value from json_each(?4)))
  and (?1 is null or ?1 = '' or t.description like '%' || ?1 || '%')
  and (?2 is null or ?2 = '' or t.transDate >= ?2)
  and (?3 is null or ?3 = '' or t.transDate <= ?3)
"#;

//language=sql
const SQL: &str = r#"
select t.*, (select json_group_array(attachmentId) from transaction_attachments where transactionId = t.id) as attachments
from transactions as t
where (?4 is null or trim(t.fromAccount) in (select value from json_each(?4)) or
       trim(t.toAccount) in (select value from json_each(?4)))
  and (?1 is null or ?1 = '' or t.description like '%' || ?1 || '%' collate nocase)
  and (?2 is null or ?2 = '' or t.transDate >= ?2)
  and (?3 is null or ?3 = '' or t.transDate <= ?3)
"#;

crate::list_sql_paginated_impl!(
    Input,
    Transaction,
    query_as,
    SQL,
    COUNT_SQL,
    offset,
    limit,
    q,
    from,
    to,
    accounts
);
