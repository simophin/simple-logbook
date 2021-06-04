use super::models::AccountGroup;

pub type Input = ();

//language=sql
crate::list_sql_impl!(
    Input,
    AccountGroup,
    query_as,
    "select * from account_groups_view"
);
