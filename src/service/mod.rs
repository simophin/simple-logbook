use std::fmt::Formatter;

pub mod account;
pub mod account_group;
pub mod login;
pub mod report;
pub mod transaction;

#[derive(Debug)]
pub struct ErrorWithStatusCode {
    pub code: usize,
    pub err: Option<anyhow::Error>,
}

impl std::fmt::Display for ErrorWithStatusCode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("{:?}", &self.err))
    }
}
impl std::error::Error for ErrorWithStatusCode {}

impl ErrorWithStatusCode {
    pub fn new(code: usize) -> Self {
        Self { code, err: None }
    }
}
