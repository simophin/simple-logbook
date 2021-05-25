use chrono::{DateTime, Utc};

use crate::sqlx_ext::Json;

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Eq, PartialEq, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct WorkLog {
    pub id: String,
    pub category: String,
    pub sub_category: String,
    pub description: String,
    pub unit_price: i64,
    pub unit: i64,
    pub created: DateTime<Utc>,
    pub attachments: Json<Vec<String>>,
}
