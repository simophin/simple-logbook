use std::borrow::Cow;

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use super::model::Transaction;
use crate::bind_sqlite_args;
use crate::service;
use crate::service::query::create_paginated_query;
use crate::service::SortOrder;
use crate::service::ToSQL;
use crate::sqlx_ext::Json;
use crate::state::AppState;

#[derive(Deserialize, Clone, Copy, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SortField {
    FromAccount,
    ToAccount,
    Amount,
    Created,
    Updated,
}

pub type Sort = service::Sort<SortField>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub q: Option<String>,
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    #[serde(default = "default_limit")]
    pub limit: i64,

    #[serde(default)]
    pub offset: i64,
    #[serde(default = "default_sorts")]
    pub sorts: Cow<'static, [Sort]>,

    pub accounts: Option<Json<Vec<String>>>,
    pub tags: Option<Json<Vec<String>>>,
    pub account_groups: Option<Json<Vec<String>>>,
}

const DEFAULT_SORTS: &[Sort] = &[
    Sort::new(SortField::Created, SortOrder::DESC),
    Sort::new(SortField::Updated, SortOrder::DESC),
];

const fn default_limit() -> i64 {
    50
}

const fn default_sorts() -> Cow<'static, [Sort]> {
    Cow::Borrowed(DEFAULT_SORTS)
}

impl Default for Input {
    fn default() -> Self {
        Self {
            q: Default::default(),
            from: Default::default(),
            to: Default::default(),
            limit: default_limit(),
            offset: Default::default(),
            sorts: default_sorts(),
            accounts: Default::default(),
            tags: Default::default(),
            account_groups: Default::default(),
        }
    }
}

impl ToSQL for SortField {
    fn to_sql(&self) -> Option<&str> {
        Some(match self {
            SortField::FromAccount => "fromAccount",
            SortField::ToAccount => "toAccount",
            SortField::Amount => "amount",
            SortField::Created => "transDate",
            SortField::Updated => "updatedDate",
        })
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
    let (data, (total, amount_total)) = create_paginated_query(
        &state.conn,
        SQL,
        bind_sqlite_args!(
            &input.q,
            &input.from,
            &input.to,
            &input.accounts,
            &input.tags,
            &input.account_groups
        ),
        input.limit,
        input.offset,
        &input.sorts,
        "COUNT(*), SUM(amount)",
    )
    .await?;

    Ok(Output {
        data,
        total,
        amount_total,
    })
}
