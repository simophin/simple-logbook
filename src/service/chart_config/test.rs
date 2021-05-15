use crate::state::AppState;

use super::*;

#[async_std::test]
async fn chart_config_rw_works() {
    let state = AppState::new_test().await;
    use serde_json::json;

    let save_input = json!({
        "chartName": "my chart",
        "chartConfig": "my value",
    });

    save::execute(&state, serde_json::from_value(save_input.clone()).unwrap())
        .await
        .unwrap();

    let get_input = json!({"chartName": "my chart"});
    let output = get::execute(&state, serde_json::from_value(get_input).unwrap())
        .await
        .unwrap();

    let output = serde_json::to_value(output).unwrap();
    assert_eq!(
        output
            .as_object()
            .unwrap()
            .get("config")
            .and_then(|v| v.as_str()),
        Some("my value")
    );
}
