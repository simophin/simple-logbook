const KEY: &'static str = "client";

pub mod get {
    use crate::state::AppState;
    use axum::{
        extract::{Query, State},
        Json,
    };

    #[derive(serde::Deserialize)]
    pub struct Input {
        pub name: String,
    }

    #[derive(serde::Serialize)]
    pub struct Output {
        pub name: String,
        pub value: Option<String>,
    }

    pub async fn execute(
        state: State<AppState>,
        Query(Input { name }): Query<Input>,
    ) -> crate::service::Result<Json<Output>> {
        use super::super::get;

        let value = get(super::KEY, Some(name.as_ref()), &state.conn).await?;
        Ok(Output { name, value }.into())
    }
}

pub mod save {
    use axum::{extract::State, Json};
    use std::borrow::Cow;

    use crate::state::AppState;

    #[derive(serde::Deserialize)]
    pub struct Input {
        pub name: String,
        pub value: Option<String>,
    }

    pub async fn execute(
        state: State<AppState>,
        Json(Input { name, value }): Json<Input>,
    ) -> crate::service::Result<()> {
        super::super::update(
            super::KEY,
            Some(name.as_ref()),
            move |v| *v = Cow::Owned(value),
            &state.conn,
        )
        .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use axum::extract::{Query, State};

    use super::*;
    use crate::state::AppState;

    #[tokio::test]
    async fn client_config_works() {
        let state = State(AppState::new_test().await);
        assert_eq!(
            get::execute(
                state.clone(),
                Query(get::Input {
                    name: "test".to_string()
                })
            )
            .await
            .expect("To get")
            .value,
            None
        );

        save::execute(
            state,
            save::Input {
                name: "test".to_string(),
                value: Some("test_value".to_string()),
            }
            .into(),
        )
        .await
        .expect("To save");

        assert_eq!(
            get::execute(
                state.clone(),
                Query(get::Input {
                    name: "test".to_string()
                })
            )
            .await
            .expect("To get")
            .value,
            Some("test_value".to_string())
        );

        save::execute(
            state.clone(),
            save::Input {
                name: "test".to_string(),
                value: None,
            }
            .into(),
        )
        .await
        .expect("To save");

        assert_eq!(
            get::execute(
                state.clone(),
                Query(get::Input {
                    name: "test".to_string()
                })
            )
            .await
            .expect("To get")
            .value,
            None
        );
    }
}
