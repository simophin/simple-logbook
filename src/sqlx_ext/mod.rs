use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use sqlx::database::HasValueRef;
use sqlx::decode::Decode;
use sqlx::{Database, Type};
use std::error::Error;
use std::ops::{Deref, DerefMut};

#[derive(Debug, Clone, Eq, PartialEq, Serialize)]
pub struct Json<T: DeserializeOwned>(pub T);

impl<T: DeserializeOwned + Serialize> ToString for Json<T> {
    fn to_string(&self) -> String {
        serde_json::to_string(&self.0).unwrap()
    }
}

impl<'de, T: DeserializeOwned> Deserialize<'de> for Json<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, <D as Deserializer<'de>>::Error>
    where
        D: Deserializer<'de>,
    {
        Ok(Self(T::deserialize(deserializer)?))
    }
}

impl<'r, DB: Database, T: DeserializeOwned> Decode<'r, DB> for Json<T>
where
    &'r str: Decode<'r, DB>,
{
    fn decode(
        value: <DB as HasValueRef<'r>>::ValueRef,
    ) -> Result<Self, Box<dyn Error + 'static + Send + Sync>> {
        let value = <&str as Decode<DB>>::decode(value)?;

        Ok(Self(serde_json::from_str(value)?))
    }
}

impl<'r, DB: Database, T: DeserializeOwned> Type<DB> for Json<T>
where
    &'r str: Type<DB>,
{
    fn type_info() -> <DB as Database>::TypeInfo {
        <&str as Type<DB>>::type_info()
    }
}

impl<T: DeserializeOwned> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: DeserializeOwned> DerefMut for Json<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
