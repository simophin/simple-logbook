pub mod account;
pub mod account_group;
pub mod attachment;
pub mod chart_config;
mod error;
pub mod invoice;
pub mod login;
pub mod report;
pub mod transaction;

use chrono::NaiveDate;
pub use error::Error;

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

#[derive(serde::Deserialize, Debug, Clone, Eq, PartialEq)]
pub struct CommonListRequest {
    #[serde(default = "default_offset")]
    pub offset: i64,

    #[serde(default = "default_limit")]
    pub limit: i64,

    pub q: Option<String>,
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
}

impl Default for CommonListRequest {
    fn default() -> Self {
        CommonListRequest {
            offset: default_offset(),
            limit: default_limit(),
            q: Default::default(),
            from: Default::default(),
            to: Default::default(),
        }
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
            let mut tx = state.conn.begin().await?;
            let sql = format!("{} LIMIT {}, {}", $sql, req.$offset, req.$limit);
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
