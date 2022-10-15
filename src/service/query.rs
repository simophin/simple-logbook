use std::fmt::Display;

use anyhow::Context;
use sqlx::{
    query_as_with,
    sqlite::{SqliteArguments, SqliteRow},
    FromRow, SqlitePool,
};

use super::WithOrder;

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

pub async fn create_paginated_query<Item, Aggregates>(
    c: &SqlitePool,
    sql: &str,
    args: SqliteArguments<'_>,
    limit: Option<usize>,
    offset: Option<usize>,
    order: Option<&impl WithOrder>,
    aggregate_select: &str,
) -> anyhow::Result<(Vec<Item>, Aggregates)>
where
    Item: Send + for<'q> FromRow<'q, SqliteRow> + Unpin + 'static,
    Aggregates: Send + Unpin + for<'q> FromRow<'q, SqliteRow> + 'static,
{
    let mut tx = c.begin().await?;

    // Query the list
    let items: Vec<Item> = {
        let limit_offset = LimitOffset { limit, offset };
        let sql = match order {
            Some(o) => format!(
                "WITH cte AS ({sql}) SELECT * from cte {order} {limit_offset}",
                order = o.gen_sql()
            ),
            None => format!("with cte as ({sql}) select * from cte {limit_offset}"),
        };

        query_as_with(&sql, args.clone())
            .fetch_all(&mut tx)
            .await
            .context("Querying list")?
    };

    // Query the aggregate
    let aggregates = {
        let sql = format!("with cte as ({sql}) select {aggregate_select} from cte");
        query_as_with::<_, Aggregates, _>(&sql, args)
            .fetch_one(&mut tx)
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
