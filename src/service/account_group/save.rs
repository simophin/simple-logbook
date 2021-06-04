use super::models::AccountGroup;

//language=sql
crate::execute_sql_from_list_impl!(
    AccountGroup,
    "insert into account_groups_view (groupName, accounts) values (?, ?)",
    group_name,
    accounts
);
