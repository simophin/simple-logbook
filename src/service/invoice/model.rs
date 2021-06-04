use chrono::{DateTime, Utc};

use crate::sqlx_ext::Json;

#[derive(serde::Deserialize, serde::Serialize, sqlx::FromRow, Clone, Debug, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub invoice_id: Option<String>,
    pub description: String,
    pub category: String,
    pub sub_category: String,
    pub unit: i64,
    pub unit_price: i64,
    pub date: DateTime<Utc>,
    pub attachments: Json<Vec<String>>,
    pub notes: String,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug, Eq, PartialEq)]
pub enum ExtraChargeType {
    #[serde(rename = "absolute")]
    Absolute,
    #[serde(rename = "percent")]
    Percent,
}

#[derive(serde::Deserialize, serde::Serialize, sqlx::FromRow, Clone, Debug, Eq, PartialEq)]
pub struct ExtraCharge {
    pub name: String,
    pub description: String,
    pub priority: i64,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub amount_type: ExtraChargeType,
    pub amount: i64,
}

#[derive(serde::Deserialize, serde::Serialize, sqlx::FromRow, Clone, Debug, Eq, PartialEq)]
pub struct ExtraInfo {
    pub name: String,
    pub value: String,
    pub priority: i64,
}

#[derive(serde::Deserialize, serde::Serialize, sqlx::FromRow, Clone, Debug, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Invoice {
    pub id: String,
    pub client: String,
    pub client_details: String,
    pub date: DateTime<Utc>,
    pub due_date: DateTime<Utc>,
    pub company_name: String,
    pub notes: String,
    pub items: Json<Vec<String>>,
    pub extra_charges: Json<Vec<ExtraCharge>>,
    pub extra_info: Json<Vec<ExtraInfo>>,
    pub attachments: Json<Vec<String>>,
    pub payment_info: String,
    /// readonly field
    pub amount: i64,
    /// readonly field
    pub reference: i64,
}
