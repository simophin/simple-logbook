use crate::service::PaginatedResponse;
use crate::state::AppState;
use bytes::Bytes;
use chrono::DateTime;
use itertools::Itertools;
use sodiumoxide::randombytes::randombytes;
use sqlx::types::Json;
use std::borrow::Cow;
use std::time::SystemTime;

pub async fn new_attachment(s: &AppState) -> (String, Bytes) {
    use super::save;
    let data = Bytes::from(randombytes(256));
    let mime_type = "text/plain";
    let name = "my-file";
    let save::Output { id } = save::execute(
        s,
        save::Input {
            data: &data,
            mime_type: Some(Cow::from(mime_type)),
            name: Cow::from(name),
        },
    )
    .await
    .expect("Save");
    (id, data)
}

#[async_std::test]
async fn attachment_rw_works() {
    use super::*;

    let app_state = AppState::new_test().await;
    let (id, data) = new_attachment(&app_state).await;

    let output = list::execute(
        &app_state,
        list::Input {
            with_data: true,
            includes: Some(Json(vec![id.clone()])),
            accounts: None,
            req: Default::default(),
        },
    )
    .await
    .expect("Get")
    .data
    .into_iter()
    .next()
    .expect("To have an element");

    assert_eq!(output.attachment.data, Some(data.to_vec()));
    assert_eq!(output.attachment.mime_type, "text/plain");
    assert_eq!(output.attachment.name, "my-file");

    let second_save_output = save::execute(
        &app_state,
        save::Input {
            data: &data,
            mime_type: Some(Cow::from("another_mimetype")),
            name: Cow::from("another_name"),
        },
    )
    .await
    .expect("Save the same data");

    assert_eq!(second_save_output.id, id);

    let output = cleanup::execute(&app_state, cleanup::Input { keep_days: 0 })
        .await
        .expect("Delete");
    assert_eq!(output.get("numAffected").unwrap().as_i64(), Some(1));
}

#[async_std::test]
async fn list_by_account_works() {
    use super::*;

    let app_state = AppState::new_test().await;
    let attachments = vec![
        new_attachment(&app_state).await.0,
        new_attachment(&app_state).await.0,
        new_attachment(&app_state).await.0,
    ];

    let tags = vec!["tag1".to_string(), "tag2".to_string()];

    use crate::service::transaction as tx;
    tx::save::execute(
        &app_state,
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
        }],
    )
    .await
    .expect("To create a transaction");

    let PaginatedResponse { total, data } = list::execute(
        &app_state,
        list::Input {
            req: Default::default(),
            includes: None,
            accounts: Some(Json(vec!["account 1".to_string()])),
            with_data: false,
        },
    )
    .await
    .expect("To list");

    assert_eq!(total as usize, attachments.len());
    assert_eq!(
        data.into_iter()
            .map(|a| a.attachment.id)
            .sorted()
            .collect_vec(),
        attachments.clone().into_iter().sorted().collect_vec()
    );

    let PaginatedResponse { total, data } = list::execute(
        &app_state,
        list::Input {
            req: Default::default(),
            includes: None,
            accounts: Some(Json(vec!["account 2 ".to_string()])),
            with_data: false,
        },
    )
    .await
    .expect("To list");

    assert_eq!(total as usize, attachments.len());
    assert_eq!(
        data.into_iter()
            .map(|a| a.attachment.id)
            .sorted()
            .collect_vec(),
        attachments.clone().into_iter().sorted().collect_vec()
    );
}
