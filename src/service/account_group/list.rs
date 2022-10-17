use crate::{service::Result, state::AppState};

use super::models::AccountGroup;

pub type Input = ();

pub async fn execute(state: &AppState, _: Input) -> Result<Vec<AccountGroup>> {
    Ok(sqlx::query_as("select * from account_groups_view")
        .fetch_all(&state.conn)
        .await?)
}
