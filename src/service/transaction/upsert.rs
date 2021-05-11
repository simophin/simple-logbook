use super::models::Transaction;
use crate::state::AppState;

pub type QueryInput = Vec<Transaction>;
pub type QueryOutput = Vec<Transaction>;

pub async fn execute(state: &AppState, input: QueryInput) -> anyhow::Result<QueryOutput> {
    let mut t = state.conn.begin().await?;
    for transaction in &input {
        sqlx::query("INSERT OR REPLACE INTO transactions (id, description, fromAccount, toAccount, amount, transDate, updatedDate) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(&transaction.id)
            .bind(&transaction.description)
            .bind(&transaction.from_account)
            .bind(&transaction.to_account)
            .bind(transaction.amount)
            .bind(&transaction.trans_date)
            .bind(&transaction.updated_date)
            .execute(&mut t)
            .await?;
    }
    t.commit().await?;

    Ok(input)
}
