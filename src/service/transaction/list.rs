use derive_more::Deref;
use serde::Deserialize;

use super::model::Transaction;
use crate::service::{CommonListRequest, Sort, SortOrder, WithOrder};
use crate::sqlx_ext::Json;

#[derive(Deserialize, Default, Deref)]
pub struct Input {
    #[serde(flatten)]
    #[deref]
    pub req: CommonListRequest,

    pub accounts: Option<Json<Vec<String>>>,
    pub tags: Option<Json<Vec<String>>>,
    pub account_groups: Option<Json<Vec<String>>>,
}

const DEFAULT_SORTS: &[Sort] = &[
    Sort::new("created", SortOrder::DESC),
    Sort::new("updated", SortOrder::DESC),
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
            "fromAccount" => Some("fromAccount"),
            "toAccount" => Some("toAccount"),
            "created" => Some("transDate"),
            "updated" => Some("updatedDate"),
            "amount" => Some("amount"),
            _ => None,
        }
    }
}

//language=sql
const SQL: &str = r#"
select t.*, 
    (select json_group_array(attachmentId) from transaction_attachments where transactionId = t.id) as attachments,
    (select json_group_array(tag) from transaction_tags where transactionId = t.id) as tags
from transactions as t
where 
   (
    (ifnull(json_array_length(?4), 0) == 0 and ifnull(json_array_length(?6), 0) == 0)
    or trim(t.fromAccount) in (
        select trim(value) from json_each(?4)
        union
        select ag.accountName from json_each(?6) g inner join account_groups ag on ag.groupName = trim(g.value) collate nocase
    ) collate nocase
    or trim(t.toAccount) in (
        select trim(value) from json_each(?4)
        union
        select ag.accountName from json_each(?6) g inner join account_groups ag on ag.groupName = trim(g.value) collate nocase
    ) collate nocase
  )
  and (
    ifnull(json_array_length(?5), 0) == 0
    or t.id in (
        select transactionId from transaction_tags 
        inner join json_each(?5) tags on tags.value = tag collate nocase
    )
  )
  and (?1 is null or ?1 = '' or t.description like '%' || ?1 || '%' collate nocase)
  and (?2 is null or ?2 = '' or t.transDate >= ?2)
  and (?3 is null or ?3 = '' or t.transDate <= ?3)
"#;

crate::list_sql_paginated_impl!(
    Input,
    Transaction,
    query_as,
    SQL,
    offset,
    limit,
    q,
    from,
    to,
    accounts,
    tags,
    account_groups
);
