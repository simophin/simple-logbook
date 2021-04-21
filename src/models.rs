use serde_derive::*;
use sqlx::database::{HasArguments, HasValueRef};
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::types::chrono::{DateTime, Utc};
use sqlx::{Database, Decode, Encode, Type, TypeInfo};
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize, Copy)]
pub struct Decimal(sqlx::types::Decimal);

impl<'r, DB> Decode<'r, DB> for Decimal
where
    &'r str: Decode<'r, DB>,
    DB: Database,
{
    fn decode(value: <DB as HasValueRef<'r>>::ValueRef) -> Result<Self, BoxDynError> {
        let value = <&'r str as Decode<DB>>::decode(value)?;
        Ok(Decimal(sqlx::types::Decimal::from_str(value)?))
    }
}

impl<'q, DB> Encode<'q, DB> for Decimal
where
    String: Encode<'q, DB>,
    DB: Database,
{
    fn encode_by_ref(&self, buf: &mut <DB as HasArguments<'q>>::ArgumentBuffer) -> IsNull {
        <String as Encode<DB>>::encode_by_ref(&self.0.to_string(), buf)
    }
}

impl<'r, DB> Type<DB> for Decimal
where
    &'r str: Type<DB>,
    DB: Database,
{
    fn type_info() -> <DB as Database>::TypeInfo {
        <&'r str as Type<DB>>::type_info()
    }

    fn compatible(ty: &<DB as Database>::TypeInfo) -> bool {
        match ty.name() {
            n if n.eq_ignore_ascii_case("integer") || n.eq_ignore_ascii_case("real") => true,
            _ => <&'r str as Type<DB>>::compatible(ty),
        }
    }
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: String,
    pub desc: String,
    pub from_account: String,
    pub to_account: String,
    pub amount: Decimal,
    pub trans_date: DateTime<Utc>,
    pub created_date: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[sqlx(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub name: String,
    pub balance: Decimal,
    pub balance_date: DateTime<Utc>,
}
