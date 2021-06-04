use crate::sqlx_ext::Json;

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct AccountGroup {
    pub group_name: String,
    pub accounts: Json<Vec<String>>,
}
