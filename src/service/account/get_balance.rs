use crate::state::AppState;
use serde_derive::*;
use sqlx::types::chrono::{DateTime, Utc};
use std::time::SystemTime;
use tide::{Body, StatusCode};

#[derive(Deserialize)]
struct QueryParams {
    before_date: Option<DateTime<Utc>>,
    account: String,
}

#[derive(Serialize, sqlx::FromRow)]
struct Response {
    account: String,
    balance: i64,
}

pub async fn query(req: tide::Request<AppState>) -> tide::Result {
    let QueryParams {
        before_date,
        account,
    } = req.query()?;
    let before_date = before_date.unwrap_or(SystemTime::now().into());
    let account: Option<Response> = sqlx::query_as(include_str!("get_balance.sql"))
        .bind(before_date)
        .bind(&account)
        .fetch_optional(&req.state().conn)
        .await?;

    if account.is_none() {
        return Err(tide::Error::from_str(
            StatusCode::NotFound,
            "Unable to find such account",
        ));
    }

    Ok(tide::Response::from(Body::from_json(&account.unwrap())?))
}
