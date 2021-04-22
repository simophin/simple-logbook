use serde_derive::*;
use sqlx::types::chrono::{DateTime, Utc};

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub name: String,
    pub balance: i64,
}
