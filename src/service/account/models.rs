use serde_derive::*;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub name: String,
    pub balance: i64,
    pub last_trans_date: String,
}
