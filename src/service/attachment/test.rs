use crate::state::AppState;
use bytes::Bytes;
use sodiumoxide::randombytes::randombytes;
use sqlx::types::Json;
use std::borrow::Cow;

pub async fn new_attachment(s: &AppState) -> (String, Bytes) {
    use super::save;
    let data = Bytes::from(randombytes(256));
    let mime_type = "text/plain";
    let name = "my-file";
    let save::Output { id } = save::execute(
        s,
        save::Input {
            data: data.clone(),
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
            req: Default::default(),
        },
    )
    .await
    .expect("Get")
    .data
    .into_iter()
    .next()
    .expect("To have an element");

    assert_eq!(output.data, Some(data.to_vec()));
    assert_eq!(output.mime_type, "text/plain");
    assert_eq!(output.name, "my-file");

    let second_save_output = save::execute(
        &app_state,
        save::Input {
            data: data.clone(),
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
