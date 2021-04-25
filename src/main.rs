#[cfg(not(debug_assertions))]
use rust_embed::*;

use sqlx::AnyPool;
use tide::log::LevelFilter;
use tide::{Body, Error, Response, StatusCode};

use crate::state::AppState;
use sqlx::migrate::MigrateDatabase;

mod service;
mod state;

#[cfg(not(debug_assertions))]
#[derive(RustEmbed)]
#[folder = "app/build"]
#[prefix = "public/"]
struct Asset;

#[cfg(not(debug_assertions))]
async fn serve_static_assert(req: tide::Request<AppState>) -> tide::Result {
    let path = match req.url().path() {
        p if p.eq_ignore_ascii_case("/") => "public/index.html",
        p if p.starts_with("/") => &p[1..],
        p => p,
    };

    let asset = Asset::get(path)
        .ok_or_else(|| tide::Error::from_str(StatusCode::NotFound, "Unable to find given path"))?;
    let mime = mime_guess::from_path(path).first_or_octet_stream();

    Ok(Response::builder(StatusCode::Ok)
        .content_type(mime.as_ref())
        .header("Cache-Control", "max-age=2678400")
        .body(Body::from(asset.as_ref()))
        .build())
}

#[cfg(debug_assertions)]
async fn serve_static_assert(_: tide::Request<AppState>) -> tide::Result {
    Err(Error::from_str(StatusCode::NotFound, "Not found"))
}

#[async_std::main]
async fn main() {
    let _ = dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be specified");

    if !sqlx::Sqlite::database_exists(&database_url).await.unwrap() {
        sqlx::Sqlite::create_database(&database_url)
            .await
            .expect("To be able to create a db");
    }

    let conn = AnyPool::connect(&database_url).await.expect(&format!(
        "Unable to open database connection to {}",
        &database_url
    ));

    #[cfg(not(debug_assertions))]
    sqlx::migrate!().run(&conn).await.expect("Migration to run");

    tide::log::with_level(LevelFilter::Info);

    let mut app = tide::with_state(AppState { conn });
    app.at("/api/transactions")
        .post(move |mut req: tide::Request<AppState>| async move {
            use service::transaction::upsert::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &query(&req.state(), input).await?,
            )?))
        });

    app.at("/api/transactions/list")
        .post(move |mut req: tide::Request<AppState>| async move {
            use service::transaction::list::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &query(&req.state(), input).await?,
            )?))
        });
    app.at("/api/transactions")
        .delete(move |mut req: tide::Request<AppState>| async move {
            use service::transaction::delete::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &execute(&req.state(), input).await?,
            )?))
        });

    app.at("/api/accounts/list")
        .post(move |mut req: tide::Request<AppState>| async move {
            use service::account::list::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &query(&req.state(), input).await?,
            )?))
        });

    // account group
    app.at("/api/accountGroups")
        .get(move |req: tide::Request<AppState>| async move {
            use service::account_group::list::query;
            Ok(Response::from(Body::from_json(
                &query(&req.state()).await?,
            )?))
        });

    app.at("/api/accountGroups")
        .delete(move |mut req: tide::Request<AppState>| async move {
            use service::account_group::delete::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &execute(&req.state(), input).await?,
            )?))
        });

    app.at("/api/accountGroups")
        .post(move |mut req: tide::Request<AppState>| async move {
            use service::account_group::replace::*;
            let input = req.body_json().await?;
            Ok(Response::from(Body::from_json(
                &execute(&req.state(), input).await?,
            )?))
        });

    app.at("/public/*").get(serve_static_assert);
    app.at("/").get(serve_static_assert);

    app.listen("0.0.0.0:4000").await.expect("To run server");
}
