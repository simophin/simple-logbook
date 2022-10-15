use std::convert::TryInto;

use serde::{Deserialize, Serialize};

use super::model::Transaction;
use crate::bind_sqlite_args;
use crate::service::query::create_paginated_query;
use crate::service::{CommonListRequest, Sort, SortOrder, WithOrder};
use crate::sqlx_ext::Json;
use crate::state::AppState;

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    #[serde(flatten)]
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
    fn get_sorts(&self) -> &[Sort<'_>] {
        self.req
            .sorts
            .as_ref()
            .map(|v| v.as_ref())
            .unwrap_or_default()
    }

    fn get_default_sorts(&self) -> &[Sort<'_>] {
        DEFAULT_SORTS
    }

    fn map_to_db(input: &str) -> Option<&str> {
        match input {
            "fromAccount" | "toAccount" | "amount" => Some(input),
            "created" => Some("transDate"),
            "updated" => Some("updatedDate"),

            _ => None,
        }
    }
}

#[derive(Serialize, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    pub total: i64,
    pub amount_total: i64,
    pub data: Vec<Transaction>,
}

const SQL: &'static str = r#"
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

pub async fn execute(state: &AppState, input: Input) -> super::super::Result<Output> {
    let (data, (total, amount_total)) = create_paginated_query::<Transaction, (i64, i64)>(
        &state.conn,
        SQL,
        bind_sqlite_args!(
            &input.req.q,
            &input.req.from,
            &input.req.to,
            &input.accounts,
            &input.tags,
            &input.account_groups
        ),
        input.req.limit.try_into().ok(),
        input.req.offset.try_into().ok(),
        Some(&input),
        "COUNT(*), SUM(amount)",
    )
    .await?;

    Ok(Output {
        data,
        total,
        amount_total,
    })
}
