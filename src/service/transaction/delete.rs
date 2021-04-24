use crate::state::AppState;
use itertools::Itertools;
use serde_derive::*;

#[derive(Deserialize)]
pub struct Input(Vec<String>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    num_deleted: usize,
}

pub async fn execute(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let Input(ids) = input;

    let placeholders = (0..ids.len()).map(|_| "?").join(",");
    let rs = ids
        .into_iter()
        .fold(
            sqlx::query(&format!(
                "DELETE FROM transactions WHERE id IN ({})",
                placeholders
            )),
            |q, a| q.bind(a),
        )
        .execute(&state.conn)
        .await?;

    Ok(Output {
        num_deleted: rs.rows_affected() as usize,
    })
}
