const KEY: &'static str = "client";

pub mod get {
    use crate::state::AppState;

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
        state: &AppState,
        Input { name }: Input,
    ) -> crate::service::Result<Output> {
        use super::super::get;

        let value = get(super::KEY, Some(name.as_ref()), &state.conn).await?;
        Ok(Output { name, value })
    }
}

pub mod save {
    use std::borrow::Cow;

    #[derive(serde::Deserialize)]
    pub struct Input {
        pub name: String,
        pub value: Option<String>,
    }

    pub async fn execute(
        state: &crate::state::AppState,
        Input { name, value }: Input,
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
    use super::*;
    use crate::state::AppState;

    #[tokio::test]
    async fn client_config_works() {
        let state = AppState::new_test().await;
        assert_eq!(
            get::execute(
                &state,
                get::Input {
                    name: "test".to_string()
                }
            )
            .await
            .expect("To get")
            .value,
            None
        );

        save::execute(
            &state,
            save::Input {
                name: "test".to_string(),
                value: Some("test_value".to_string()),
            },
        )
        .await
        .expect("To save");

        assert_eq!(
            get::execute(
                &state,
                get::Input {
                    name: "test".to_string()
                }
            )
            .await
            .expect("To get")
            .value,
            Some("test_value".to_string())
        );

        save::execute(
            &state,
            save::Input {
                name: "test".to_string(),
                value: None,
            },
        )
        .await
        .expect("To save");

        assert_eq!(
            get::execute(
                &state,
                get::Input {
                    name: "test".to_string()
                }
            )
            .await
            .expect("To get")
            .value,
            None
        );
    }
}
