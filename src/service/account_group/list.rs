use axum::extract;

use crate::{service::Result, state::AppState};

use super::models::AccountGroup;

pub async fn execute(state: extract::State<AppState>) -> Result<extract::Json<Vec<AccountGroup>>> {
    Ok(extract::Json::from(
        sqlx::query_as("select * from account_groups_view")
            .fetch_all(&state.conn)
            .await?,
    ))
}
