use crate::service::error::map_to_std;
use crate::state::AppState;
use itertools::Itertools;

#[derive(serde::Deserialize)]
pub struct Input {
    pub q: Option<String>,
}

pub type Output = Vec<String>;

pub async fn execute(state: &AppState, Input { q }: Input) -> crate::service::Result<Output> {
    let rs: Vec<(String,)> = sqlx::query_as::<_, (String,)>(include_str!("list_cat.sql"))
        .bind(q)
        .fetch_all(&state.conn)
        .await
        .map_err(map_to_std)?;

    Ok(rs.into_iter().map(|(v,)| v).collect_vec())
}
