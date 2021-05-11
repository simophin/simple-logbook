#[cfg(not(debug_assertions))]
use rust_embed::*;

use sqlx::AnyPool;
use tide::log::LevelFilter;
use tide::{Body, Error, Response, StatusCode};

use crate::state::AppState;
use sqlx::migrate::MigrateDatabase;
use std::convert::TryFrom;
use tide::http::headers::HeaderValue;
use tide::security::CorsMiddleware;
use tide::utils::After;

mod config;
mod middleware;
mod service;
mod state;

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

macro_rules! endpoint {
    ($app: expr, $method:ident, $path:expr, $pkg:path) => {
        $app.at($path)
            .$method(move |mut req: tide::Request<AppState>| async move {
                use $pkg::*;
                let input = req.body_json().await?;
                Ok(Response::from(Body::from_json(
                    &execute(&req.state(), input).await?,
                )?))
            });
    };
}

macro_rules! endpoint_get {
    ($app: expr, $path:expr, $pkg:path) => {
        $app.at($path)
            .get(move |req: tide::Request<AppState>| async move {
                use $pkg::*;
                let input = req.query()?;
                Ok(Response::from(Body::from_json(
                    &execute(&req.state(), input).await?,
                )?))
            });
    };
}

#[async_std::main]
async fn main() {
    let _ = dotenv::dotenv().ok();
    sodiumoxide::init().expect("Sodium to start up");

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

    app.with(
        CorsMiddleware::new()
            .allow_methods(HeaderValue::try_from("GET, DELETE, POST, OPTIONS").unwrap()),
    );
    app.with(middleware::token_verify::execute);
    app.with(After(|mut res: Response| async {
        match res.downcast_error::<service::ErrorWithStatusCode>() {
            Some(service::ErrorWithStatusCode { code, err }) => {
                let code = code.to_owned();
                let err = err.as_ref().map(|e| e.to_string());
                if let Some(err) = err {
                    res.set_body(Body::from(err));
                }
                res.set_status(StatusCode::try_from(code as u16).unwrap());
            }
            _ => {}
        }
        Ok(res)
    }));

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

    app.at("/public/*").get(serve_static_assert);
    app.at("/*").get(serve_static_assert);
    app.at("/").get(serve_static_assert);

    app.listen("0.0.0.0:4000").await.expect("To run server");
}
