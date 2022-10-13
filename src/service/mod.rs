pub mod account;
pub mod account_group;
pub mod attachment;
pub mod config;
mod error;
pub mod invoice;
pub mod login;
pub mod report;
pub mod tag;
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
    pub sorts: Option<Vec<Sort>>,
}

impl Default for CommonListRequest {
    fn default() -> Self {
        CommonListRequest {
            offset: default_offset(),
            limit: default_limit(),
            q: None,
            from: None,
            to: None,
            sorts: None,
        }
    }
}

pub trait WithOrder {
    fn get_sorts(&self) -> &Option<Vec<Sort>>;
    fn get_default_sorts() -> &'static [Sort];
    fn map_to_db(input: &str) -> Option<&'static str>;

    fn gen_order_by(&self, out: &mut String) {
        let mut fields = HashSet::new();
        let mut written_to_out = false;
        let start_index = out.len();
        for (field, order) in match self.get_sorts() {
            Some(v) if !v.is_empty() => v.iter(),
            _ => Self::get_default_sorts().iter(),
        }
        .filter(|sort| fields.insert(sort.field.as_ref()))
        .filter_map(
            |Sort { field, order }| match Self::map_to_db(field.as_ref()) {
                Some(v) => Some((v, order.to_sql())),
                None => None,
            },
        ) {
            if written_to_out {
                out.push_str(",");
            }

            out.push_str(field);
            out.push_str(" ");
            out.push_str(order);
            written_to_out = true
        }

        if written_to_out {
            out.insert_str(start_index, " ORDER BY ");
        }
    }
}

#[derive(serde::Serialize, Debug, Clone, Eq, PartialEq)]
pub struct PaginatedResponse<T: serde::Serialize> {
    pub data: Vec<T>,
    pub total: i64,
}

impl<T: serde::Serialize> PaginatedResponse<T> {
    pub fn map<R: serde::Serialize>(self, f: impl Fn(T) -> R) -> PaginatedResponse<R> {
        let PaginatedResponse { data, total } = self;
        return PaginatedResponse {
            data: data.into_iter().map(f).collect_vec(),
            total,
        };
    }
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
macro_rules! list_sql_with_sort_impl {
    ($inputType:ident, $outputType:ident, $query_op:ident, $sql:expr $(,$binding:ident)*) => {
        #[allow(unused_mut, unused_variables)]
        pub async fn execute(
            state: &crate::state::AppState,
            req: $inputType,
        ) -> crate::service::Result<Vec<$outputType>> {
            use crate::service::WithOrder;
            let mut sql: String = $sql.to_string();
            req.gen_order_by(&mut sql);
            let mut e = sqlx::$query_op(&sql);
            $(
                e = e.bind(req.$binding);
            )*
            Ok(e.fetch_all(&state.conn).await?)
        }
    };
}

#[macro_export]
macro_rules! list_sql_paginated_impl {
    ($inputType:ident, $outputType:ident, $query_op:ident, $sql:expr,
    $offset:ident, $limit:ident $(,$binding:ident)*) => {
        #[allow(unused_mut, unused_variables)]
        pub async fn execute(
            state: &crate::state::AppState,
            req: $inputType,
        ) -> crate::service::Result<crate::service::PaginatedResponse<$outputType>> {
            use crate::service::WithOrder;
            let mut sql: String = $sql.to_string();
            req.gen_order_by(&mut sql);
            let sql = sql;

            let mut tx = state.conn.begin().await?;
            let paginated_sql = format!("{sql} LIMIT {}, {}", &req.$offset, &req.$limit);
            let mut e = sqlx::$query_op(&paginated_sql);
            $(
                e = e.bind(&req.$binding);
            )*
            let data = e.fetch_all(&mut tx).await?;
            let count_sql = format!("WITH cte AS ({sql}) SELECT COUNT(*) FROM cte");
            let mut e = sqlx::query_scalar(&count_sql);
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
