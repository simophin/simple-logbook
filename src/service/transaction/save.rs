use crate::{
    service::{GenericUpdateResponse, Result},
    state::AppState,
};

use super::model::Transaction;

//language=sql
const INSERT_SQL: &str = r#"
insert into 
    transactions_view (id, description, fromAccount, toAccount, amount, transDate, updatedDate, attachments, tags)
values (?, ?, ?, ?, ?, ?, ?, ?, ?)
"#;

pub async fn execute(
    state: &AppState,
    transactions: Vec<Transaction>,
) -> Result<GenericUpdateResponse> {
    let mut num_affected: usize = 0;
    let mut tx = state.conn.begin().await?;

    for Transaction {
        id,
        description,
        from_account,
        to_account,
        amount,
        trans_date,
        updated_date,
        attachments,
        tags,
    } in transactions
    {
        num_affected += sqlx::query(INSERT_SQL)
            .bind(id)
            .bind(description)
            .bind(from_account)
            .bind(to_account)
            .bind(amount)
            .bind(trans_date)
            .bind(updated_date)
            .bind(attachments)
            .bind(tags)
            .execute(&mut tx)
            .await?
            .rows_affected() as usize;
    }

    tx.commit().await?;
    Ok(GenericUpdateResponse { num_affected })
}
