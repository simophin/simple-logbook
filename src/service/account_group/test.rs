use crate::sqlx_ext::Json;
use crate::state::AppState;

use super::*;

#[async_std::test]
async fn account_group_rw_works() {
    let state = AppState::new_test().await;
    save::execute(
        &state,
        vec![models::AccountGroup {
            group_name: "g1".into(),
            accounts: Json(vec!["a1".into(), "a2".into()]),
        }],
    )
    .await
    .expect("To save");

    let mut groups = list::execute(&state, Default::default())
        .await
        .expect("To get");
    assert_eq!(groups.len(), 1);

    let group = groups.get_mut(0).unwrap();
    group.accounts.sort();
    assert_eq!(group.accounts.0, vec!["a1".to_string(), "a2".to_string()]);

    // Use different accounts
    save::execute(
        &state,
        vec![models::AccountGroup {
            group_name: "g1".into(),
            accounts: Json(vec!["a2".into(), "a3".into()]),
        }],
    )
    .await
    .expect("To save different set of accounts");

    let mut groups = list::execute(&state, Default::default())
        .await
        .expect("To get a second time");
    assert_eq!(groups.len(), 1);

    let group = groups.get_mut(0).unwrap();
    group.accounts.sort();
    assert_eq!(group.accounts.0, vec!["a2".to_string(), "a3".to_string()]);

    // Delete group
    delete::execute(
        &state,
        delete::Input {
            group_names: Json(vec!["g1".into()]),
        },
    )
    .await
    .expect("To delete");
    assert_eq!(
        list::execute(&state, Default::default())
            .await
            .expect("To query")
            .len(),
        0
    );
}
