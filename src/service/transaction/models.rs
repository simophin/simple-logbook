use serde_derive::*;
use sqlx::types::chrono::{DateTime, Utc};

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: String,
    pub desc: String,
    pub from_account: String,
    pub to_account: String,
    pub amount: i64,
    pub trans_date: DateTime<Utc>,
    pub created_date: DateTime<Utc>,
}
