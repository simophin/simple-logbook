use std::time::SystemTime;

use chrono::DateTime;

use crate::sqlx_ext::Json;
use crate::state::AppState;

use super::*;
use crate::service::attachment::test::new_attachment;
use crate::service::transaction::model::Transaction;
use crate::utils::random_string;
use itertools::Itertools;
use uuid::Uuid;

pub async fn new_transaction(state: &AppState, id: Option<String>) -> model::Transaction {
    // Create attachments
    let mut attachment_ids = Vec::new();
    for _ in 1..10 {
        attachment_ids.push(new_attachment(&state).await.0);
    }

    // Create transaction
    let tx = model::Transaction {
        id: id.unwrap_or(Uuid::new_v4().to_string()),
        description: random_string(),
        from_account: random_string(),
        to_account: random_string(),
        amount: 100,
        trans_date: "2019-01-01".to_string(),
        updated_date: DateTime::from(SystemTime::now()),
        attachments: Json(attachment_ids),
    };
    save::execute(state, vec![tx.clone()])
        .await
        .expect("To save transaction");
    tx
}

pub fn normalise_transaction(mut tx: Transaction) -> Transaction {
    tx.attachments.sort();
    tx
}

fn normalise_transaction_list(mut v: Vec<Transaction>) -> Vec<Transaction> {
    v.sort_by(|lhs, rhs| lhs.id.cmp(&rhs.id));
    v.into_iter().map(normalise_transaction).collect_vec()
}

#[async_std::test]
async fn transaction_works() {
    let state = AppState::new_test().await;

    let tx1 = new_transaction(&state, None).await;
    let tx2 = new_transaction(&state, Some(tx1.id.clone())).await;

    let rs = list::execute(&state, Default::default())
        .await
        .expect("To list");
    assert_eq!(rs.total, 1);
    assert_eq!(
        normalise_transaction(
            rs.data
                .into_iter()
                .next()
                .expect("To have at least 1 element")
        ),
        normalise_transaction(tx2.clone())
    );

    let tx3 = new_transaction(&state, None).await;
    let rs = list::execute(&state, Default::default())
        .await
        .expect("To list");
    assert_eq!(rs.total, 2);
    assert_eq!(
        normalise_transaction_list(vec![tx2, tx3]),
        normalise_transaction_list(rs.data)
    );
}
