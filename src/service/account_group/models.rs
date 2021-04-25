use serde_derive::*;

#[derive(sqlx::FromRow, Deserialize, Serialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AccountGroup {
    pub group_name: String,
    pub account_name: String,
}
