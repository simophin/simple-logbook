use super::*;
use crate::sqlx_ext::Json;
use crate::state::AppState;
use chrono::DateTime;
use std::time::SystemTime;

#[async_std::test]
async fn work_log_rw_works() {
    let state = AppState::new_test().await;

    let item = model::WorkLog {
        id: "123".to_string(),
        category: "cat1".to_string(),
        sub_category: "cat2".to_string(),
        description: "Very important description".to_string(),
        unit_price: 100,
        created: DateTime::from(SystemTime::now()),
        unit: 13,
        attachments: Json(vec![]),
    };

    save::execute(&state, item.clone()).await.unwrap();

    let output = search::execute(&state, Default::default()).await.unwrap();

    assert_eq!(output.limit, 50);
    assert_eq!(output.offset, 0);
    assert_eq!(output.data, vec![item.clone()]);
    assert_eq!(output.total, 1);

    let mut input: search::Input = Default::default();
    input.q = Some("important".to_string());
    let output = search::execute(&state, input).await.unwrap();

    assert_eq!(output.limit, 50);
    assert_eq!(output.offset, 0);
    assert_eq!(output.data, vec![item.clone()]);
    assert_eq!(output.total, 1);

    let output = list_cat::execute(
        &state,
        list_cat::Input {
            q: Some("cat".to_string()),
        },
    )
    .await
    .expect("List cat");
    assert_eq!(output, vec!["cat1".to_string()]);

    let output = list_subcat::execute(
        &state,
        list_subcat::Input {
            q: Some("cat".to_string()),
        },
    )
    .await
    .expect("List subcat");
    assert_eq!(output, vec!["cat2".to_string()]);
}
