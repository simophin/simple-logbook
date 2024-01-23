use crate::state::AppState;
use axum::{extract::State, Json};
use serde_derive::*;

pub type Input = Vec<String>;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    num_deleted: usize,
}

pub async fn execute(
    state: State<AppState>,
    Json(input): Json<Input>,
) -> crate::service::Result<Json<Output>> {
    let mut tx = state.conn.begin().await?;
    let mut success = 0;
    for id in input {
        success += sqlx::query("DELETE FROM transactions WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await?
            .rows_affected() as usize;
    }
    tx.commit().await?;

    Ok(Output {
        num_deleted: success,
    }
    .into())
}
