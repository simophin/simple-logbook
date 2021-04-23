mod service;
mod state;

use crate::state::AppState;
use sqlx::SqlitePool;
use tide::log::LevelFilter;
use tide::{Body, Response};

#[async_std::main]
async fn main() {
    let _ = dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be specified");

    let conn = SqlitePool::connect(&database_url).await.expect(&format!(
        "Unable to open database connection to {}",
        &database_url
    ));

    tide::log::with_level(LevelFilter::Debug);

    let mut app = tide::with_state(AppState { conn });
    app.at("/transactions")
        .post(move |mut req: tide::Request<AppState>| async move {
            use service::transaction::upsert::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &query(&req.state(), input).await?,
            )?))
        });

    app.at("/transactions/list")
        .post(move |mut req: tide::Request<AppState>| async move {
            use service::transaction::list::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &query(&req.state(), input).await?,
            )?))
        });

    app.at("/accountSummaries")
        .get(service::get_all_account_summary);
    app.at("/accounts/search").get(service::search_account);
    app.at("/account/balance").get(service::get_account_balance);

    app.listen("127.0.0.1:3000").await.expect("To run server");
}
