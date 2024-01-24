use crate::service::PaginatedResponse;
use crate::state::AppState;
use axum::extract::State;
use bytes::Bytes;
use chrono::DateTime;
use itertools::Itertools;
use sodiumoxide::randombytes::randombytes;
use sqlx::types::Json;
use std::time::SystemTime;

pub async fn new_attachment(s: &AppState) -> (String, Bytes) {
    use super::save;
    let data = Bytes::from(randombytes(256));
    let mime_type = "text/plain";
    let name = "my-file";
    let id = save::save(s, Some(mime_type), &data, name)
        .await
        .expect("Save");
    (id, data)
}

#[tokio::test]
async fn attachment_rw_works() {
    use super::*;

    let app_state = State(AppState::new_test().await);
    let (id, data) = new_attachment(&app_state).await;

    let output = list::execute(
        app_state.clone(),
        list::Input {
            with_data: true,
            includes: Some(Json(vec![id.clone()])),
            ..Default::default()
        }
        .into(),
    )
    .await
    .expect("Get")
    .0
    .data
    .into_iter()
    .next()
    .expect("To have an element");

    assert_eq!(output.attachment.mime_type, "text/plain");
    assert_eq!(output.attachment.name, "my-file");

    let second_save_output = save::save(&app_state, Some("another_mimetype"), &data, "anoter_name")
        .await
        .expect("Save the same data");

    assert_eq!(second_save_output, id);

    let (mime, actual_data) = get::get(&app_state, &id, output.signed_id.0.as_ref())
        .await
        .expect("To retrieve attachment");

    assert_eq!(data.as_ref(), actual_data.as_slice());
    assert_eq!(mime, "text/plain");

    let output = cleanup::execute(app_state.clone(), cleanup::Input { keep_days: 0 }.into())
        .await
        .expect("Delete");
    assert_eq!(output.num_affected, 1);
}

#[tokio::test]
async fn list_by_account_works() {
    use super::*;

    let app_state = State(AppState::new_test().await);
    let attachments = vec![
        new_attachment(&app_state).await.0,
        new_attachment(&app_state).await.0,
        new_attachment(&app_state).await.0,
    ];

    let tags = vec!["tag1".to_string(), "tag2".to_string()];

    use crate::service::transaction as tx;
    let _ = tx::save::execute(
        app_state.clone(),
        vec![tx::model::Transaction {
            id: "1".to_string(),
            description: "desc".to_string(),
            from_account: "Account 1".to_string(),
            to_account: "Account 2".to_string(),
            amount: 100,
            trans_date: "2020-01-01".to_string(),
            updated_date: DateTime::from(SystemTime::now()),
            attachments: Json(attachments.clone()),
            tags: Json(tags),
        }]
        .into(),
    )
    .await
    .expect("To create a transaction");

    let PaginatedResponse { total, data } = list::execute(
        app_state.clone(),
        list::Input {
            accounts: Some(Json(vec!["account 1".to_string()])),
            ..Default::default()
        }
        .into(),
    )
    .await
    .expect("To list")
    .0;

    assert_eq!(total as usize, attachments.len());
    assert_eq!(
        data.into_iter()
            .map(|a| a.attachment.id)
            .sorted()
            .collect_vec(),
        attachments.clone().into_iter().sorted().collect_vec()
    );

    let PaginatedResponse { total, data } = list::execute(
        app_state.clone(),
        list::Input {
            accounts: Some(Json(vec!["account 2 ".to_string()])),
            ..Default::default()
        }
        .into(),
    )
    .await
    .expect("To list")
    .0;

    assert_eq!(total as usize, attachments.len());
    assert_eq!(
        data.into_iter()
            .map(|a| a.attachment.id)
            .sorted()
            .collect_vec(),
        attachments.clone().into_iter().sorted().collect_vec()
    );
}
