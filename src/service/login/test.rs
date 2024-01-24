use axum::extract::State;

use super::*;
use crate::service::login::creds::Signed;
use crate::state::AppState;
use std::borrow::Cow;

#[tokio::test]
async fn login_works() {
    let state = State(AppState::new_test().await);

    // Verify should pass when no password set
    assert_eq!(
        verify::query(
            &state,
            verify::Input {
                token: Signed(Cow::from("")),
            },
        )
        .await
        .expect("To verify"),
        true
    );

    // Update without password
    let token = update::execute(
        state.clone(),
        update::Input {
            old_password: "".into(),
            new_password: "123".into(),
        }
        .into(),
    )
    .await
    .expect("To update")
    .0
    .token;

    assert!(!token.is_empty());

    // Verify should not pass without token
    assert_eq!(
        verify::query(
            &state,
            verify::Input {
                token: Signed(Cow::from("")),
            }
        )
        .await
        .expect("To verify"),
        false
    );

    // Verify should pass with token
    assert_eq!(
        verify::query(
            &state,
            verify::Input {
                token: Signed(Cow::from(token.clone())),
            }
        )
        .await
        .expect("To verify"),
        true,
    );

    // Update should not pass without correct old password
    assert!(update::execute(
        state.clone(),
        update::Input {
            old_password: "".into(),
            new_password: "1234".into(),
        }
        .into(),
    )
    .await
    .is_err());

    // Update should pass with correct old password
    let token = update::execute(
        state.clone(),
        update::Input {
            old_password: "123".into(),
            new_password: "".into(),
        }
        .into(),
    )
    .await
    .expect("To update")
    .0
    .token;

    assert!(token.is_empty());
}
