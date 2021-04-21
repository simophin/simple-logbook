use crate::models::Transaction;
use crate::state::AppState;
use tide::Body;

pub async fn upsert_transaction(mut req: tide::Request<AppState>) -> tide::Result {
    let mut transactions: Vec<Transaction> = req.body_json().await?;
    let mut t = req.state().conn.begin().await?;
    for transaction in &mut transactions {
        sqlx::query("INSERT OR REPLACE INTO transactions (id, desc, fromAccount, toAccount, amount, transDate, createdDate) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(&transaction.id)
            .bind(&transaction.desc)
            .bind(&transaction.from_account)
            .bind(&transaction.to_account)
            .bind(transaction.amount)
            .bind(transaction.trans_date)
            .bind(transaction.created_date)
            .execute(&mut t)
            .await?;
    }
    t.commit().await?;

    Ok(Body::from_json(&transactions)?.into())
}
