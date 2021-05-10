use crate::state::AppState;
use std::future::Future;
use std::pin::Pin;
use tide::http::Method;
use tide::{Next, Request, Response, StatusCode};

pub fn execute<'a>(
    req: Request<AppState>,
    next: Next<'a, AppState>,
) -> Pin<Box<dyn Future<Output = tide::Result> + Send + 'a>> {
    use crate::service::login::verify;
    Box::pin(async {
        if !req.url().path().starts_with("/api")
            || req.url().path().starts_with("/api/sign")
            || req.method() == Method::Options
        {
            return Ok(next.run(req).await);
        }

        let token = req.header("Authorization").and_then(|v| {
            v.last()
                .to_string()
                .split("Bearer ")
                .skip(1)
                .next()
                .map(|s| s.to_owned())
        });

        let verified = verify::query(req.state(), verify::Input { token }).await?;

        if verified {
            Ok(next.run(req).await)
        } else {
            Ok(Response::from(StatusCode::Unauthorized))
        }
    })
}
