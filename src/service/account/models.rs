use serde_derive::*;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub name: String,
    pub balance: i64,
}
