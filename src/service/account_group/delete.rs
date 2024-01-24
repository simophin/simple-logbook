use axum::extract;

use crate::{
    service::{GenericUpdateResponse, Result},
    sqlx_ext::Json,
    state::AppState,
};

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub group_names: Json<Vec<String>>,
}

pub type Output = GenericUpdateResponse;

pub async fn execute(
    state: extract::State<AppState>,
    extract::Query(Input { group_names }): extract::Query<Input>,
) -> Result<extract::Json<Output>> {
    let output: Output = sqlx::query(
        "delete from account_groups where groupName in (select trim(value) from json_each(?)) collate nocase"
    )
    .bind(group_names)
    .execute(&state.conn).await?.into();
    Ok(extract::Json::from(output))
}
