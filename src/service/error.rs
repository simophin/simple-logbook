use std::borrow::Cow;
use std::fmt;

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(Debug)]
pub enum Error {
    InvalidArgument(Cow<'static, str>),
    InvalidCredentials,
    ResourceNotFound,
    Other(anyhow::Error),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(self, f)
    }
}

impl<E: Into<anyhow::Error>> From<E> for Error {
    fn from(e: E) -> Self {
        Error::Other(e.into())
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Error::InvalidArgument(arg) => (StatusCode::BAD_REQUEST, arg).into_response(),
            Error::InvalidCredentials => StatusCode::UNAUTHORIZED.into_response(),
            Error::ResourceNotFound => StatusCode::NOT_FOUND.into_response(),
            Error::Other(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, msg.to_string()).into_response()
            }
        }
    }
}
