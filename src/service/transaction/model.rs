use crate::sqlx_ext::Json;
use serde_derive::*;
use sqlx::types::chrono::{DateTime, Utc};

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Clone, Eq, PartialEq)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: String,
    pub description: String,
    pub from_account: String,
    pub to_account: String,
    pub amount: i64,
    pub trans_date: String,
    pub updated_date: DateTime<Utc>,
    pub attachments: Json<Vec<String>>,
}
