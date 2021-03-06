use crate::service::login::creds::Signed;
use crate::state::AppState;
use async_trait::async_trait;
use std::borrow::Cow;
use tide::http::Method;
use tide::{Middleware, Next, Request, Response, StatusCode};

pub struct Verifier;

#[async_trait]
impl Middleware<AppState> for Verifier {
    async fn handle(&self, req: Request<AppState>, next: Next<'_, AppState>) -> tide::Result {
        use crate::service::login::verify;
        if !req.url().path().starts_with("/api")
            || req.url().path().starts_with("/api/sign")
            || req.method() == Method::Options
        {
            return Ok(next.run(req).await);
        }

        let token = req
            .header("Authorization")
            .and_then(|v| v.last().as_str().split("Bearer ").skip(1).next())
            .map(|v| Signed(Cow::from(v)))
            .unwrap_or_default();

        let verified = verify::query(req.state(), verify::Input { token }).await?;

        if verified {
            Ok(next.run(req).await)
        } else {
            Ok(Response::from(StatusCode::Unauthorized))
        }
    }
}
