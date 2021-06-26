use std::convert::TryFrom;
use std::str::FromStr;

#[cfg(not(debug_assertions))]
use rust_embed::*;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::SqlitePool;
use tide::http::headers::HeaderValue;
use tide::log::LevelFilter;
use tide::security::CorsMiddleware;

use crate::state::AppState;

mod middleware;
#[macro_use]
pub mod service;
#[macro_use]
mod service_adapter;
mod sqlx_ext;
mod state;
#[macro_use]
mod utils;

#[cfg(not(debug_assertions))]
#[derive(RustEmbed)]
#[folder = "app/build"]
#[prefix = "public/"]
struct Asset;

#[cfg(not(debug_assertions))]
async fn serve_static_assert(req: tide::Request<AppState>) -> tide::Result {
    use tide::StatusCode;
    let path = match req.url().path() {
        p if p.eq_ignore_ascii_case("/") || !p.starts_with("/public") => "public/index.html",
        p if p.starts_with("/") => &p[1..],
        p => p,
    };

    let asset = Asset::get(path)
        .ok_or_else(|| tide::Error::from_str(StatusCode::NotFound, "Unable to find given path"))?;
    let mime = mime_guess::from_path(path).first_or_octet_stream();

    Ok(tide::Response::builder(StatusCode::Ok)
        .content_type(mime.as_ref())
        .header("Cache-Control", "max-age=2678400")
        .body(tide::Body::from(asset.as_ref()))
        .build())
}

#[cfg(debug_assertions)]
async fn serve_static_assert(req: tide::Request<AppState>) -> tide::Result {
    let mut url = req.url().clone();
    url.set_host(Some("127.0.0.1"))?;
    let _ = url.set_port(Some(3000));
    let mut builder = surf::RequestBuilder::new(req.method(), url);
    for (name, value) in req.iter() {
        builder = builder.header(name, value);
    }

    let mut surf_res = builder.await?;
    let mut res = tide::Response::new(surf_res.status());
    for (name, value) in surf_res.iter() {
        res.insert_header(name, value);
    }
    res.set_body(surf_res.take_body());
    Ok(res)
}

#[async_std::main]
async fn main() {
    #[cfg(debug_assertions)]
    let _ = dotenv::dotenv().ok();

    let port = u16::from_str(
        std::env::var("PORT")
            .unwrap_or_else(|_| "4000".to_string())
            .as_ref(),
    )
    .expect("Port to be a number");

    sodiumoxide::init().expect("Sodium to start up");

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be specified");

    let conn = SqlitePool::connect_with(
        SqliteConnectOptions::from_str(&database_url)
            .expect("to parse database url")
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Delete),
    )
    .await
    .expect(&format!(
        "Unable to open database connection to {}",
        &database_url
    ));

    tide::log::with_level(LevelFilter::Info);

    if std::env::var("DATABASE_RUN_MIGRATION") != Ok("false".to_string()) {
        sqlx::migrate!().run(&conn).await.expect("Migration to run");
    }

    let mut app = tide::with_state(AppState { conn, port });

    app.with(
        CorsMiddleware::new()
            .allow_methods(HeaderValue::try_from("GET, DELETE, POST, PUT, OPTIONS").unwrap()),
    );
    app.with(middleware::token_verify::Verifier {});

    use service::*;

    // authentication
    endpoint!(app, post, "/api/changePassword", login::update);
    endpoint!(app, post, "/api/sign", login::sign);
    endpoint!(app, post, "/api/refreshToken", login::refresh);

    // transactions
    endpoint!(app, post, "/api/transactions", transaction::save);
    endpoint!(app, post, "/api/transactions/list", transaction::list);
    endpoint!(app, delete, "/api/transactions", transaction::delete);
    endpoint!(app, post, "/api/accounts/list", account::list);

    // account group
    endpoint_get!(app, "/api/accountGroups", account_group::list);
    endpoint!(app, delete, "/api/accountGroups", account_group::delete);
    endpoint!(app, post, "/api/accountGroups", account_group::save);

    // reports
    endpoint!(app, post, "/api/reports/sum", report::sum);
    endpoint!(app, post, "/api/reports/balance", report::balance);

    // invoice related
    endpoint!(app, post, "/api/invoices", invoice::save);
    endpoint!(app, delete, "/api/invoices", invoice::delete);
    endpoint!(app, post, "/api/invoices/list", invoice::list);
    endpoint!(app, post, "/api/invoices/items", invoice::save_item);
    endpoint!(app, post, "/api/invoices/items/list", invoice::list_item);
    endpoint!(
        app,
        post,
        "/api/invoices/items/categories/search",
        invoice::search_cat
    );
    app.at("/api/invoice/print")
        .get(service_adapter::invoice::print_pdf);

    // config related
    endpoint_get!(app, "/api/config", config::client::get);
    endpoint!(app, post, "/api/config", config::client::save);

    // attachments
    app.at("/api/attachments")
        .get(service_adapter::attachment::get);

    app.at("/api/attachments")
        .post(service_adapter::attachment::post);
    endpoint!(app, delete, "/api/attachments", attachment::cleanup);

    endpoint!(app, post, "/api/attachments/list", attachment::list);

    app.at("/healthcheck")
        .get(|_: tide::Request<AppState>| async move {
            Ok(tide::Response::new(tide::StatusCode::Ok))
        });

    app.at("/public/*").get(serve_static_assert);
    app.at("/*").get(serve_static_assert);
    app.at("/").get(serve_static_assert);

    app.listen(format!(
        "{}:{}",
        std::env::var("HOST").unwrap_or("127.0.0.1".to_string()),
        port
    ))
    .await
    .expect("To run server");
}
