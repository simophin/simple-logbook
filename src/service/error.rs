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

impl std::error::Error for Error {}

impl From<anyhow::Error> for Error {
    fn from(err: anyhow::Error) -> Self {
        Self::Other(err)
    }
}

pub fn map_to_std<E: std::error::Error + Send + Sync + 'static>(e: E) -> Error {
    Error::Other(e.into())
}
