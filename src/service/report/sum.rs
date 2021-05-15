use super::super::{error::map_to_std, Error, Result};
use crate::state::AppState;
use chrono::NaiveDate;
use serde_derive::*;
use std::borrow::Cow;

#[derive(Deserialize)]
pub struct Input {
    from: Option<NaiveDate>,
    to: Option<NaiveDate>,
    freq: super::Frequency,
    accounts: Vec<String>,
}

#[derive(Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DataPoint {
    total: i64,
    time_point: String,
}

pub type Output = Vec<DataPoint>;

pub async fn execute(state: &AppState, input: Input) -> Result<Output> {
    let Input {
        from,
        to,
        freq,
        accounts,
    } = input;

    if accounts.is_empty() {
        return Ok(vec![]);
    }

    match (from, to) {
        (Some(f), Some(t)) if f > t => {
            return Err(Error::InvalidArgument(Cow::from("Invalid date range")));
        }
        _ => {}
    }

    let from = from
        .map(|t| t.to_string())
        .unwrap_or_else(|| "1970-01-01".into());
    let to = to
        .map(|t| t.to_string())
        .unwrap_or_else(|| "2999-12-31".into());

    let time_format = match freq {
        super::Frequency::Daily => "%Y-%j",
        super::Frequency::Weekly => "%Y-%W",
        super::Frequency::Monthly => "%Y-%m",
        super::Frequency::Yearly => "%Y",
    };

    Ok(sqlx::query_as(include_str!("sum.sql"))
        .bind(from)
        .bind(to)
        .bind(serde_json::to_string(&accounts).map_err(map_to_std)?)
        .bind(time_format)
        .fetch_all(&state.conn)
        .await
        .map_err(map_to_std)?)
}
