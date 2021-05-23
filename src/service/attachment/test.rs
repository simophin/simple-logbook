use crate::state::AppState;
use bytes::Bytes;
use sodiumoxide::randombytes::randombytes;
use std::borrow::Cow;

#[async_std::test]
async fn attachment_rw_works() {
    use super::*;

    let app_state = AppState::new_test().await;
    let data = Bytes::from(randombytes(256));
    let mime_type = "text/plain";
    let name = "my-file";
    let upsert::Output { id } = upsert::execute(
        &app_state,
        upsert::Input {
            data: data.clone(),
            mime_type: Some(Cow::from(mime_type)),
            name: Cow::from(name),
        },
    )
    .await
    .expect("Save");

    let output = get::execute(
        &app_state,
        get::Input {
            id: Cow::from(id.clone()),
        },
    )
    .await
    .expect("Get");

    assert_eq!(output.data, data);
    assert_eq!(output.mime_type, mime_type);

    let output = list::execute(
        &app_state,
        list::Input {
            ids: vec![Cow::from(id.clone())],
        },
    )
    .await
    .expect("list")
    .into_iter()
    .next()
    .expect("To have 1 attachment summary");

    assert_eq!(output.mime_type.as_str(), mime_type);
    assert_eq!(output.name, name);
    assert_eq!(output.id, id);

    let second_output = upsert::execute(
        &app_state,
        upsert::Input {
            data: data.clone(),
            mime_type: Some(Cow::from(mime_type)),
            name: Cow::from(name),
        },
    )
    .await
    .expect("Save the same data");

    assert_eq!(second_output.id, id);
}
