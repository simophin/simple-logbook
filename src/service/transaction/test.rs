use std::borrow::Cow;
use std::time::SystemTime;

use bytes::Bytes;
use chrono::DateTime;
use sodiumoxide::randombytes::randombytes;

use crate::service::transaction::list::Output;
use crate::sqlx_ext::Json;
use crate::state::AppState;

use super::super::attachment;
use super::*;

async fn save_and_check_tx(state: &AppState, mut tx: model::Transaction) {
    upsert::execute(&state, vec![tx.clone()]).await.expect("t1");

    // Check data
    let Output {
        mut data,
        offset,
        limit,
        total,
    } = list::execute(
        &state,
        list::QueryInput {
            q: None,
            from: None,
            to: None,
            accounts: None,
            limit: None,
            offset: None,
        },
    )
    .await
    .expect("transaction");

    tx.attachments.sort();
    data.first_mut().unwrap().attachments.sort();

    assert_eq!(data, vec![tx]);
    assert_eq!(offset, 0);
    assert_eq!(limit, 50);
    assert_eq!(total, 1);
}

#[async_std::test]
async fn attachment_works() {
    let state = AppState::new_test().await;

    // Create attachments
    let mut attachment_ids = Vec::new();
    for i in 1..10 {
        let output = attachment::upsert::execute(
            &state,
            attachment::upsert::Input {
                name: Cow::from(format!("Attachment {}", i)),
                data: Bytes::from(randombytes(128)),
                mime_type: Some(Cow::from("application/octave")),
            },
        )
        .await
        .expect("To upload attachment");
        attachment_ids.push(output.id);
    }

    // Create transaction
    let mut tx = model::Transaction {
        id: "t1".to_string(),
        description: "desc".to_string(),
        from_account: "Acc1".to_string(),
        to_account: "Acc2".to_string(),
        amount: 100,
        trans_date: "2019-01-01".to_string(),
        updated_date: DateTime::from(SystemTime::now()),
        attachments: Json(vec![attachment_ids[0].clone(), attachment_ids[2].clone()]),
    };

    save_and_check_tx(&state, tx.clone()).await;
    tx.attachments.0 = vec![attachment_ids[1].clone(), attachment_ids[4].clone()];
    save_and_check_tx(&state, tx.clone()).await;

    tx.attachments.0 = vec![attachment_ids[5].clone(), attachment_ids[6].clone()];
    save_and_check_tx(&state, tx.clone()).await;
}
