use super::models::AccountGroup;

#[derive(serde::Deserialize, Default)]
pub struct Input {}

//language=sql
crate::list_sql_impl!(
    Input,
    AccountGroup,
    query_as,
    "select * from account_groups_view"
);
