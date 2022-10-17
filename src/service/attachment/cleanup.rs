use crate::{
    service::{GenericUpdateResponse, Result},
    state::AppState,
};

pub const fn default_keep_days() -> i64 {
    7
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    #[serde(default = "default_keep_days")]
    pub keep_days: i64,
}

//language=sql
const SQL: &str = r#"
delete from attachments
where id in (select r.id
             from attachment_references r
             where r.numReferences = 0
               and r.lastUpdated <= datetime(current_timestamp, '-' || cast(?1 as text) || ' days'))
"#;

pub async fn execute(
    state: &AppState,
    Input { keep_days }: Input,
) -> Result<GenericUpdateResponse> {
    Ok(sqlx::query(SQL)
        .bind(keep_days)
        .execute(&state.conn)
        .await?
        .into())
}
