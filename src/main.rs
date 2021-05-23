use std::convert::TryFrom;

#[cfg(not(debug_assertions))]
use rust_embed::*;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use tide::http::headers::HeaderValue;
use tide::log::LevelFilter;
use tide::security::CorsMiddleware;
use tide::utils::After;
use tide::{Body, Error, Response, StatusCode};

use crate::state::AppState;
use std::str::FromStr;

mod config;
mod middleware;
mod service;
#[macro_use]
mod service_adapter;
mod sqlx_ext;
mod state;

#[cfg(not(debug_assertions))]
#[derive(RustEmbed)]
#[folder = "app/build"]
#[prefix = "public/"]
struct Asset;

#[cfg(not(debug_assertions))]
async fn serve_static_assert(req: tide::Request<AppState>) -> tide::Result {
    let path = match req.url().path() {
        p if p.eq_ignore_ascii_case("/") || !p.starts_with("/public") => "public/index.html",
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
    sodiumoxide::init().expect("Sodium to start up");

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be specified");

    let conn = SqlitePool::connect_with(
        SqliteConnectOptions::from_str(&database_url).expect("to parse database url"),
    )
    .await
    .expect(&format!(
        "Unable to open database connection to {}",
        &database_url
    ));

    #[cfg(not(debug_assertions))]
    sqlx::migrate!().run(&conn).await.expect("Migration to run");

    tide::log::with_level(LevelFilter::Info);

    let mut app = tide::with_state(AppState { conn });

    app.with(
        CorsMiddleware::new()
            .allow_methods(HeaderValue::try_from("GET, DELETE, POST, OPTIONS").unwrap()),
    );
    app.with(middleware::token_verify::Verifier {});
    app.with(After(middleware::error::execute));

    use service::*;

    // authentication
    endpoint!(app, post, "/api/changePassword", login::update);
    endpoint!(app, post, "/api/sign", login::sign);
    endpoint!(app, post, "/api/refreshToken", login::refresh);

    // transactions
    endpoint!(app, post, "/api/transactions", transaction::upsert);
    endpoint!(app, post, "/api/transactions/list", transaction::list);
    endpoint!(app, delete, "/api/transactions", transaction::delete);
    endpoint!(app, post, "/api/accounts/list", account::list);

    // account group
    endpoint_get!(app, "/api/accountGroups", account_group::list);
    endpoint!(app, delete, "/api/accountGroups", account_group::delete);
    endpoint!(app, post, "/api/accountGroups", account_group::replace);

    // reports
    endpoint!(app, post, "/api/reports/sum", report::sum);
    endpoint!(app, post, "/api/reports/balance", report::balance);

    // chart config
    endpoint_get!(app, "/api/chartConfig", chart_config::get);
    endpoint!(app, post, "/api/chartConfig", chart_config::save);

    // attachments
    app.at("/api/attachments")
        .get(service_adapter::attachment::get);

    app.at("/api/attachments")
        .post(service_adapter::attachment::post);

    endpoint!(app, post, "/api/attachments/list", attachment::list);

    app.at("/public/*").get(serve_static_assert);
    app.at("/*").get(serve_static_assert);
    app.at("/").get(serve_static_assert);

    app.listen("0.0.0.0:4000").await.expect("To run server");
}
