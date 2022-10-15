pub mod account;
pub mod account_group;
pub mod attachment;
pub mod config;
mod error;
pub mod invoice;
pub mod login;
mod query;
pub mod report;
pub mod tag;
pub mod transaction;

use chrono::NaiveDate;
pub use error::Error;
use itertools::Itertools;
use std::borrow::Cow;
use std::fmt::Display;

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
pub struct Sort<'a> {
    pub field: Cow<'a, str>,
    pub order: SortOrder,
}

impl<'a> Sort<'a> {
    pub const fn new(f: &'a str, order: SortOrder) -> Self {
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
    pub sorts: Option<Vec<Sort<'static>>>,
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
    fn get_sorts(&self) -> &[Sort<'_>];
    fn get_default_sorts(&self) -> &[Sort<'_>];
    fn map_to_db(input: &str) -> Option<&str>;

    fn gen_sql(&self) -> OrderDisplay
    where
        Self: Sized,
    {
        OrderDisplay(match self.get_sorts() {
            v if v.is_empty() => self.get_default_sorts(),
            v => v,
        })
    }
}

pub struct OrderDisplay<'a>(&'a [Sort<'a>]);

impl<'a> Display for OrderDisplay<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.0.is_empty() {
            return Ok(());
        }

        f.write_str("order by ")?;
        let mut generated_fields = Vec::with_capacity(self.0.len());
        for sort in self.0 {
            match generated_fields.binary_search(&sort.field.as_ref()) {
                Ok(_) => {
                    log::warn!("Sort {sort:?} already generated");
                    continue;
                }
                Err(index) => {
                    generated_fields.insert(index, sort.field.as_ref());
                }
            };

            if generated_fields.len() > 1 {
                f.write_str(", ")?;
            }

            f.write_fmt(format_args!("{} {}", sort.field, sort.order.to_sql()))?;
        }
        Ok(())
    }
}

#[derive(serde::Serialize, Debug, Clone, Eq, PartialEq)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
}

impl<T> PaginatedResponse<T> {
    pub fn map<R>(self, f: impl Fn(T) -> R) -> PaginatedResponse<R> {
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
            let sql = format!("{} {}", $sql, req.gen_sql());
            let mut e = sqlx::$query_op(&sql);
            $(
                e = e.bind(req.$binding);
            )*
            Ok(e.fetch_all(&state.conn).await?)
        }
    };
}

#[macro_export]
macro_rules! sql_paginated_impl {
    (
        inputType = $inputType:ident,
        outputType = $outputType:ident,
        sql = $sql:literal,
        bindings = [$($bvalue:ident,)*],
        offset = $offset:ident,
        limit = $limit:ident,
        outputTypeListField = $outputTypeListField:ident,
        aggregateSelect = $aggregateSelect:literal,
    ) => {
        #[allow(unused_mut, unused_variables)]
        pub async fn execute(
            state: &crate::state::AppState,
            req: $inputType,
        ) -> crate::service::Result<$outputType> {
            let mut tx = state.conn.begin().await?;
            let mut q = sqlx::query_as::<_, $outputType>(concat!(
                "with cte as ( ",
                $sql,
                " ) ",
                "select ",
                $aggregateSelect,
                " from cte"
            ));
            $(
                q = q.bind(&req.$bvalue)
            )*;

            let mut o = q.fetch_one(&mut tx).await?;

            let list_sql = format!(
                concat!(
                    "with cte as (",
                    $sql,
                    ") select * from cte {} limit {}, {}"
                ),
                crate::service::WithOrder::gen_sql(&req),
                req.$offset,
                req.$limit
            );

            let mut q = sqlx::query_as(&list_sql);
            $(
                q = q.bind(&req.$bvalue)
            )*;

            o.$outputTypeListField = q.fetch_all(&mut tx).await?;

            Ok(o)
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

            let mut tx = state.conn.begin().await?;
            let sql = format!("WITH cte as ({}) SELECT * FROM cte {} LIMIT {}, {}",
                $sql,
                req.gen_sql(),
                &req.$offset,
                &req.$limit
            );
            let mut e = sqlx::$query_op(&sql);
            $(
                e = e.bind(&req.$binding);
            )*
            let data = e.fetch_all(&mut tx).await?;
            let count_sql = format!("WITH cte AS ({}) SELECT COUNT(*) FROM cte", $sql);
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
