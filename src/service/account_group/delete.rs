use crate::sqlx_ext::Json;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub group_names: Json<Vec<String>>,
}

//language=sql
crate::execute_sql_impl!(Input,
    "delete from account_groups where groupName in (select trim(value) from json_each(?)) collate nocase",
    group_names
);
