use super::model::Transaction;

//language=sql
const INSERT_SQL: &str = r#"
insert into 
    transactions_view (id, description, fromAccount, toAccount, amount, transDate, updatedDate, attachments)
values (?, ?, ?, ?, ?, ?, ?, ?)
"#;

crate::execute_sql_from_list_impl!(
    Transaction,
    INSERT_SQL,
    id,
    description,
    from_account,
    to_account,
    amount,
    trans_date,
    updated_date,
    attachments
);
