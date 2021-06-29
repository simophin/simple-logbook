use tide::{Body, Response, StatusCode};

pub mod attachment;

pub fn transform_service_result<T: serde::Serialize>(r: crate::service::Result<T>) -> tide::Result {
    match r {
        Ok(body) => Ok(Response::from(Body::from_json(&body)?)),
        Err(e) => Err(e.into()),
    }
}

impl From<crate::service::Error> for tide::Error {
    fn from(err: crate::service::Error) -> Self {
        use crate::service::Error;
        let (status_code, msg) = match err {
            Error::Other(err) => return err.into(),
            Error::InvalidArgument(r) => (StatusCode::BadRequest, r.to_string()),
            Error::InvalidCredentials => (StatusCode::Forbidden, "".to_string()),
            Error::ResourceNotFound => (StatusCode::NotFound, "".to_string()),
        };

        tide::Error::from_str(status_code, msg)
    }
}

macro_rules! endpoint {
    ($app: expr, $method:ident, $path:expr, $pkg:path) => {
        $app.at($path)
            .$method(move |mut req: tide::Request<AppState>| async move {
                use $pkg::*;
                let input = req.body_json().await?;
                crate::service_adapter::transform_service_result(execute(&req.state(), input).await)
            });
    };
}

macro_rules! endpoint_get {
    ($app: expr, $path:expr, $pkg:path) => {
        $app.at($path)
            .get(move |req: tide::Request<AppState>| async move {
                use $pkg::*;
                let input = req.query()?;
                crate::service_adapter::transform_service_result(execute(&req.state(), input).await)
            });
    };
}

const HTTP_DATE_FORMAT: &str = "%a, %d %b %Y %T GMT";
