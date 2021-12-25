pub mod creds;
pub mod refresh;
pub mod sign;
pub mod update;
pub mod verify;

#[cfg(test)]
mod test;

use std::time::Duration;
const DEFAULT_LOGIN_TOKEN_VALID_DURATION: Duration = Duration::from_secs(3600 * 12 * 10);
