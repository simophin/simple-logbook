use std::net::IpAddr;
use std::str::FromStr;

use axum::extract::{Request, State};
use axum::http::{Method, StatusCode};
use axum::middleware::from_fn_with_state;
use axum::response::Response;
use axum::routing::get;
use axum::Router;
use rust_embed::RustEmbed;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::SqlitePool;
use tokio::net::TcpListener;
use tower_http::cors::{self, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

mod middleware;
#[macro_use]
pub mod service;
// #[macro_use]
// mod service_adapter;
mod sqlx_ext;
mod state;
#[macro_use]
mod utils;

#[derive(RustEmbed)]
#[folder = "app/build"]
#[prefix = "public/"]
struct Asset;

async fn serve_static_asset(
    state: State<AppState>,
    req: Request,
) -> Result<Response, (StatusCode, &'static str)> {
    let path = match req.uri().path() {
        p if p.eq_ignore_ascii_case("/") || !p.starts_with("/public") => "public/index.html",
        p if p.starts_with("/") => &p[1..],
        p => p,
    };

    let asset =
        Asset::get(path).ok_or_else(|| (StatusCode::NOT_FOUND, "Unable to find given path"))?;

    let mime = mime_guess::from_path(path).first_or_octet_stream();

    Ok(Response::builder()
        .header("Content-Type", mime.as_ref())
        .header("Cache-Control", "max-age=2678400")
        .body(asset.data.into())
        .unwrap())
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    env_logger::init();

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

    if std::env::var("DATABASE_RUN_MIGRATION") != Ok("false".to_string()) {
        sqlx::migrate!().run(&conn).await.expect("Migration to run");
    }

    let state = AppState { conn, port };

    let cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::DELETE,
            Method::PUT,
            Method::OPTIONS,
        ])
        .allow_origin(cors::Any);

    let api_routes = Router::new().nest("/account", service::account::router());

    let app = Router::new()
        .nest("/api", api_routes)
        .route("/public", get(serve_static_asset))
        .route("/", get(serve_static_asset))
        .layer(cors)
        .route_layer(from_fn_with_state(
            state.clone(),
            middleware::token_verify::execute,
        ))
        .with_state(state);

    let bind_ip: IpAddr = std::env::var("HOST")
        .unwrap_or("127.0.0.1".to_string())
        .parse()
        .expect("Parsing IP address");

    let listener = TcpListener::bind((bind_ip, port))
        .await
        .expect("To bind on socket");

    log::info!("Listening on {bind_ip}:{port}");

    axum::serve(listener, app)
        .await
        .expect("To run axum server");
    // app.with(middleware::token_verify::Verifier {});

    // use service::*;

    // // authentication
    // endpoint!(app, post, "/api/changePassword", login::update);
    // endpoint!(app, post, "/api/sign", login::sign);
    // endpoint!(app, post, "/api/refreshToken", login::refresh);

    // // transactions
    // endpoint!(app, post, "/api/transactions", transaction::save);
    // endpoint!(app, post, "/api/transactions/list", transaction::list);
    // endpoint!(app, delete, "/api/transactions", transaction::delete);
    // endpoint!(app, post, "/api/accounts/list", account::list);

    // // tags
    // endpoint!(app, post, "/api/tags/list", tag::list);

    // // account group
    // endpoint_get!(app, "/api/accountGroups", account_group::list);
    // endpoint!(app, delete, "/api/accountGroups", account_group::delete);
    // endpoint!(app, post, "/api/accountGroups", account_group::save);

    // // reports
    // endpoint!(app, post, "/api/reports/sum", report::sum);
    // endpoint!(app, post, "/api/reports/balance", report::balance);

    // // invoice related
    // // endpoint!(app, post, "/api/invoices", invoice::save);
    // // endpoint!(app, delete, "/api/invoices", invoice::delete);
    // // endpoint!(app, post, "/api/invoices/list", invoice::list);
    // // endpoint!(app, post, "/api/invoices/items", invoice::save_item);
    // // endpoint!(app, post, "/api/invoices/items/list", invoice::list_item);
    // // endpoint!(
    // //     app,
    // //     post,
    // //     "/api/invoices/items/categories/search",
    // //     invoice::search_cat
    // // );

    // // config related
    // endpoint_get!(app, "/api/config", config::client::get);
    // endpoint!(app, post, "/api/config", config::client::save);

    // // attachments
    // app.at("/attachment").get(service_adapter::attachment::get);

    // app.at("/api/attachments")
    //     .post(service_adapter::attachment::post);
    // endpoint!(app, delete, "/api/attachments", attachment::cleanup);

    // endpoint!(app, post, "/api/attachments/list", attachment::list);

    // app.at("/healthcheck")
    //     .get(|_: tide::Request<AppState>| async move {
    //         Ok(tide::Response::new(tide::StatusCode::Ok))
    //     });

    // app.at("/public/*").get(serve_static_asset);
    // app.at("/*").get(serve_static_asset);
    // app.at("/").get(serve_static_asset);

    // app.listen(format!(
    //     "{}:{}",
    //     std::env::var("HOST").unwrap_or("127.0.0.1".to_string()),
    //     port
    // ))
    // .await
    // .expect("To run server");
}
