pub mod account;
pub mod account_group;
pub mod attachment;
pub mod config;
mod error;
// pub mod invoice;
pub mod login;
mod query;
pub mod report;
pub mod tag;
pub mod transaction;

use chrono::NaiveDate;
pub use error::Error;
use itertools::Itertools;
use sqlx::sqlite::SqliteQueryResult;
use std::borrow::Cow;
use std::convert::TryInto;
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

    fn gen_sql(&self) -> OrderDisplay<Self>
    where
        Self: Sized,
    {
        OrderDisplay(self)
    }
}

pub struct OrderDisplay<'a, T>(&'a T);

impl<'a, T: WithOrder> Display for OrderDisplay<'a, T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let sorts = match self.0.get_sorts() {
            v if v.is_empty() => self.0.get_default_sorts(),
            v => v,
        };
        if sorts.is_empty() {
            return Ok(());
        }

        f.write_str("order by ")?;
        let mut generated_fields = Vec::with_capacity(sorts.len());

        for sort in sorts {
            let db_field = match T::map_to_db(sort.field.as_ref()) {
                Some(v) => v,
                None => continue,
            };

            match generated_fields.binary_search(&db_field) {
                Ok(_) => {
                    log::warn!("Sort {sort:?} already generated");
                    continue;
                }
                Err(index) => {
                    generated_fields.insert(index, db_field);
                }
            };

            if generated_fields.len() > 1 {
                f.write_str(", ")?;
            }

            f.write_fmt(format_args!("{} {}", db_field, sort.order.to_sql()))?;
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

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GenericUpdateResponse {
    pub num_affected: usize,
}

impl From<SqliteQueryResult> for GenericUpdateResponse {
    fn from(r: SqliteQueryResult) -> Self {
        Self {
            num_affected: r.rows_affected().try_into().unwrap_or_default(),
        }
    }
}
