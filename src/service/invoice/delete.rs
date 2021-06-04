use crate::sqlx_ext::Json;

#[derive(serde::Deserialize)]
pub struct Input {
    pub ids: Json<Vec<String>>,
}

//language=sql
crate::execute_sql_impl!(
    Input,
    "UPDATE invoices SET deleted = true WHERE id in (select value from json_each(?1))",
    ids
);
