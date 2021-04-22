use crate::state::AppState;
use serde_derive::*;
use tide::{Body, Response};

#[derive(Deserialize)]
struct QueryParams {
    name: String,
}

pub async fn query(req: tide::Request<AppState>) -> tide::Result {
    let QueryParams { name } = req.query()?;
    let accounts: Vec<String> = sqlx::query_scalar(include_str!("search_by_name.sql"))
        .bind(name)
        .fetch_all(&req.state().conn)
        .await?;

    Ok(Response::from(Body::from_json(&accounts)?))
}
