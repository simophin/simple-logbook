pub mod account;
pub mod account_group;
pub mod attachment;
pub mod config;
mod error;
pub mod login;
mod query;
pub mod report;
pub mod tag;
pub mod transaction;
pub mod import;

pub use error::Error;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteQueryResult;
use std::{convert::TryInto, fmt::Display, marker::PhantomData};

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Deserialize, Serialize, Debug, Clone, Eq, PartialEq, Copy)]
pub enum SortOrder {
    ASC,
    DESC,
}

pub trait ToSQL {
    fn to_sql(&self) -> Option<&str>;
}

pub fn display_sorts_sql<F: ToSQL>(sorts: impl AsRef<[Sort<F>]>) -> impl Display {
    SortsSQLDisplay(sorts, PhantomData)
}

struct SortsSQLDisplay<F, T: AsRef<[Sort<F>]>>(T, PhantomData<F>);

impl<F, T> Display for SortsSQLDisplay<F, T>
where
    T: AsRef<[Sort<F>]>,
    F: ToSQL,
{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut generated_fields = Vec::with_capacity(self.0.as_ref().len());

        for Sort { field, order } in self.0.as_ref() {
            let field = match field.to_sql() {
                Some(v) => v,
                None => continue,
            };

            match generated_fields.binary_search(&field) {
                Ok(_) => {
                    log::warn!("Field {field:?} already generated");
                    continue;
                }
                Err(index) => {
                    generated_fields.insert(index, field);
                }
            };

            if generated_fields.len() > 1 {
                f.write_str(", ")?;
            } else {
                f.write_str("order by ")?;
            }

            f.write_fmt(format_args!("{} {}", field, order.to_sqlite()))?;
        }
        Ok(())
    }
}

#[derive(Deserialize, Serialize, Debug, Clone, Eq, PartialEq)]
pub struct Sort<F> {
    pub field: F,
    pub order: SortOrder,
}

impl<F> Sort<F> {
    pub const fn new(field: F, order: SortOrder) -> Self {
        Self { field, order }
    }
}

#[derive(Serialize, Debug, Clone, Eq, PartialEq)]
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
