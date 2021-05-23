use super::model::Transaction;
use crate::state::AppState;

pub type Input = Vec<Transaction>;
pub type Output = Vec<Transaction>;

pub async fn execute(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let mut t = state.conn.begin().await?;
    for transaction in &input {
        sqlx::query(include_str!("upsert_transaction.sql"))
            .bind(&transaction.id)
            .bind(&transaction.description)
            .bind(&transaction.from_account)
            .bind(&transaction.to_account)
            .bind(transaction.amount)
            .bind(&transaction.trans_date)
            .bind(&transaction.updated_date)
            .execute(&mut t)
            .await?;

        sqlx::query(include_str!("upsert_tx_attachment_delete.sql"))
            .bind(&transaction.id)
            .bind(transaction.attachments.to_string())
            .execute(&mut t)
            .await?;

        for attachment_id in transaction.attachments.iter() {
            sqlx::query(include_str!("upsert_tx_attachment_upsert.sql"))
                .bind(&transaction.id)
                .bind(attachment_id)
                .execute(&mut t)
                .await?;
        }
    }
    t.commit().await?;
    Ok(input)
}
