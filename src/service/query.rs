use std::{convert::TryInto, fmt::Display};

use anyhow::Context;
use sqlx::{
    query_as_with,
    sqlite::{SqliteArguments, SqliteRow},
    FromRow, SqlitePool,
};

use super::{display_sorts_sql, Sort, SortOrder, ToSQL};

#[macro_export]
macro_rules! bind_sqlite_args {
    ($arg1:expr $(,$arg:expr)*) => {
        (|| {
            use sqlx::Arguments;
            let mut args = sqlx::sqlite::SqliteArguments::default();
            args.add($arg1);
            $(args.add($arg);)*
            args
        })()
    };
}

impl SortOrder {
    pub const fn to_sqlite(self) -> &'static str {
        match self {
            SortOrder::ASC => "asc",
            SortOrder::DESC => "desc",
        }
    }
}

pub async fn create_paginated_query<F, Item, Aggregates>(
    c: &SqlitePool,
    sql: &str,
    args: SqliteArguments<'_>,
    limit: impl TryInto<usize>,
    offset: impl TryInto<usize>,
    sorts: impl AsRef<[Sort<F>]>,
    aggregate_select: &str,
) -> anyhow::Result<(Vec<Item>, Aggregates)>
where
    Item: Send + for<'q> FromRow<'q, SqliteRow> + Unpin + 'static,
    Aggregates: Send + Unpin + for<'q> FromRow<'q, SqliteRow> + 'static,
    F: ToSQL,
{
    let mut tx = c.begin().await?;

    // Query the list
    let items: Vec<Item> = {
        let limit_offset = LimitOffset {
            limit: limit.try_into().ok(),
            offset: offset.try_into().ok(),
        };
        let sql = format!(
            "WITH cte AS ({sql}) SELECT * from cte {order} {limit_offset}",
            order = display_sorts_sql(sorts)
        );

        query_as_with(&sql, args.clone())
            .fetch_all(&mut *tx)
            .await
            .context("Querying list")?
    };

    // Query the aggregate
    let aggregates = {
        let sql = format!("with cte as ({sql}) select {aggregate_select} from cte");
        query_as_with::<_, Aggregates, _>(&sql, args)
            .fetch_one(&mut *tx)
            .await
            .context("Querying aggregate")?
    };

    Ok((items, aggregates))
}

struct LimitOffset {
    limit: Option<usize>,
    offset: Option<usize>,
}

impl Display for LimitOffset {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match (self.limit, self.offset) {
            (Some(limit), Some(offset)) => f.write_fmt(format_args!("limit {offset}, {limit}")),
            (Some(limit), None) => f.write_fmt(format_args!("limit {limit}")),
            _ => Ok(()),
        }
    }
}
