pub mod account;
pub mod account_group;
pub mod attachment;
pub mod config;
mod error;
pub mod invoice;
pub mod login;
pub mod report;
pub mod transaction;

use chrono::NaiveDate;
pub use error::Error;
use itertools::Itertools;
use std::borrow::Cow;
use std::collections::HashSet;

pub type Result<T> = std::result::Result<T, Error>;

pub const fn default_limit() -> i64 {
    50
}

pub const fn default_offset() -> i64 {
    0
}

pub const fn no_limit() -> i64 {
    -1
}

#[derive(serde::Deserialize, Debug, Clone, Eq, PartialEq, Copy)]
pub enum SortOrder {
    ASC,
    DESC,
}

impl SortOrder {
    pub const fn to_sql(self) -> &'static str {
        match self {
            SortOrder::ASC => "asc",
            SortOrder::DESC => "desc",
        }
    }
}

#[derive(serde::Deserialize, Debug, Clone, Eq, PartialEq)]
pub struct Sort {
    pub field: Cow<'static, str>,
    pub order: SortOrder,
}

impl Sort {
    pub const fn new(f: &'static str, order: SortOrder) -> Self {
        return Sort {
            field: Cow::Borrowed(f),
            order,
        };
    }
}

#[derive(serde::Deserialize, Debug, Clone, Eq, PartialEq)]
pub struct CommonListRequest {
    #[serde(default = "default_offset")]
    pub offset: i64,

    #[serde(default = "default_limit")]
    pub limit: i64,

    pub q: Option<String>,
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    pub sorts: Vec<Sort>,
}

impl Default for CommonListRequest {
    fn default() -> Self {
        CommonListRequest {
            offset: default_offset(),
            limit: default_limit(),
            q: None,
            from: None,
            to: None,
            sorts: Default::default(),
        }
    }
}

pub trait WithOrder {
    fn get_sorts(&self) -> &Vec<Sort>;
    fn get_default_sorts() -> &'static [Sort];
    fn map_to_db(input: &str) -> Option<&'static str>;

    fn gen_sql(&self) -> Vec<(&'static str, &'static str)> {
        let mut fields = HashSet::new();
        match self.get_sorts() {
            v if v.is_empty() => Self::get_default_sorts().iter(),
            v => v.iter(),
        }
        .filter(|sort| fields.insert(&sort.field))
        .filter_map(
            |Sort { field, order }| match Self::map_to_db(field.as_ref()) {
                Some(v) => Some((v, order.to_sql())),
                None => None,
            },
        )
        .collect_vec()
    }
}

#[derive(serde::Serialize, Debug, Clone, Eq, PartialEq)]
pub struct PaginatedResponse<T: serde::Serialize> {
    pub data: Vec<T>,
    pub total: i64,
}

#[macro_export]
macro_rules! list_sql_impl {
    ($inputType:ident, $outputType:ident, $query_op:ident, $sql:expr $(,$binding:ident)*) => {
        #[allow(unused_mut, unused_variables)]
        pub async fn execute(
            state: &crate::state::AppState,
            req: $inputType,
        ) -> crate::service::Result<Vec<$outputType>> {
            let mut e = sqlx::$query_op($sql);
            $(
                e = e.bind(req.$binding);
            )*
            Ok(e.fetch_all(&state.conn).await?)
        }
    };
}

#[macro_export]
macro_rules! list_sql_paginated_impl {
    ($inputType:ident, $outputType:ident, $query_op:ident, $sql:expr, $count_sql:expr,
    $offset:ident, $limit:ident $(,$binding:ident)*) => {
        #[allow(unused_mut, unused_variables)]
        pub async fn execute(
            state: &crate::state::AppState,
            req: $inputType,
        ) -> crate::service::Result<crate::service::PaginatedResponse<$outputType>> {
            use crate::service::WithOrder;
            use itertools::Itertools;

            let order_fields = req.gen_sql();
            let orders = if order_fields.len() > 0 {
                format!("ORDER BY {}",
                    order_fields
                    .into_iter()
                    .map(|(name, o)| format!("{} {}", name, o))
                    .collect_vec()
                    .join(",")
                )
            } else {
                String::new()
            };

            let sql = format!("{} {} LIMIT {}, {}", $sql, orders, req.$offset, req.$limit);

            let mut tx = state.conn.begin().await?;
            let mut e = sqlx::$query_op(&sql);
            $(
                e = e.bind(&req.$binding);
            )*
            let data = e.fetch_all(&mut tx).await?;
            let mut e = sqlx::query_scalar($count_sql);
            $(
                e = e.bind(&req.$binding);
            )*
            let total = e.fetch_one(&mut tx).await?;
            Ok(crate::service::PaginatedResponse {
                data, total
            })
        }
    };
}

#[macro_export]
macro_rules! execute_sql_impl {
    ($inputType:ident, $sql:expr $(,$binding:ident)*) => {
        pub async fn execute(
            state: &crate::state::AppState,
            req: $inputType,
        ) -> crate::service::Result<serde_json::Value> {
            let mut e = sqlx::query($sql);
            $(
                e = e.bind(&req.$binding);
            )*
            let num = e.execute(&state.conn).await?.rows_affected();
            Ok(serde_json::json!({
                "numAffected": num
            }))
        }
    };
}

#[macro_export]
macro_rules! execute_sql_from_list_impl {
    ($inputType:ident, $sql:expr $(,$binding:ident)*) => {
        pub async fn execute(
            state: &crate::state::AppState,
            req: Vec<$inputType>,
        ) -> crate::service::Result<serde_json::Value> {
            let mut num = 0;
            let mut tx = state.conn.begin().await?;
            for b in req {
                let mut e = sqlx::query($sql);
                $(
                    e = e.bind(b.$binding);
                )*
                num += e.execute(&mut tx).await?.rows_affected();
            }

            let _ = tx.commit().await?;
            Ok(serde_json::json!({
                "numAffected": num
            }))
        }
    };
}
