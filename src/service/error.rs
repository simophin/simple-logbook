use std::borrow::Cow;
use std::fmt;

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
