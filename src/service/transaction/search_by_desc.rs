use super::models::Transaction;
use crate::state::AppState;
use serde_derive::*;
use tide::Body;

#[derive(Deserialize)]
struct QueryParams {
    desc: String,
}

pub async fn query(req: tide::Request<AppState>) -> tide::Result {
    let QueryParams { desc } = req.query()?;

    let rs: Vec<Transaction> = sqlx::query_as(include_str!("search_by_desc.sql"))
        .bind(&desc)
        .fetch_all(&req.state().conn)
        .await?;

    Ok(Body::from_json(&rs)?.into())
}
