pub mod attachment;

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

const HTTP_DATE_FORMAT: &str = "%a, %d %b %Y %T GMT";
