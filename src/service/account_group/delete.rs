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

pub async fn execute(state: &AppState, Input { group_names }: Input) -> Result<Output> {
    let result = sqlx::query(
        "delete from account_groups where groupName in (select trim(value) from json_each(?)) collate nocase"
    )
    .bind(group_names)
    .execute(&state.conn).await?;
    Ok(result.into())
}
