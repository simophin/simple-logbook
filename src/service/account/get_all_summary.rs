use crate::state::AppState;
use serde_derive::*;
use sqlx::types::chrono::{DateTime, Utc};
use std::time::SystemTime;
use tide::{Body, Response};

#[derive(Deserialize)]
struct QueryParams {
    before_date: Option<DateTime<Utc>>,
}

pub async fn query(req: tide::Request<AppState>) -> tide::Result {
    let QueryParams { before_date } = req.query()?;
    let before_date = before_date.unwrap_or(SystemTime::now().into());
    let accounts: Vec<super::models::AccountSummary> =
        sqlx::query_as(include_str!("get_all_summary.sql"))
            .bind(before_date)
            .fetch_all(&req.state().conn)
            .await?;

    Ok(Response::from(Body::from_json(&accounts)?))
}
