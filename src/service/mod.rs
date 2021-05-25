pub mod account;
pub mod account_group;
pub mod attachment;
pub mod chart_config;
mod error;
pub mod login;
pub mod report;
pub mod transaction;
pub mod work_log;

pub use error::Error;
pub type Result<T> = std::result::Result<T, Error>;
