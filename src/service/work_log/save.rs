use crate::service::error::map_to_std;
use crate::service::Result;
use crate::state::AppState;

pub type Input = super::model::WorkLog;
pub type Output = ();

pub async fn execute(
    state: &AppState,
    Input {
        id,
        category,
        sub_category,
        description,
        unit_price,
        unit,
        created,
        attachments,
    }: Input,
) -> Result<Output> {
    let mut tx = state.conn.begin().await.map_err(map_to_std)?;

    let _ = sqlx::query(include_str!("save.sql"))
        .bind(&id)
        .bind(&category)
        .bind(&sub_category)
        .bind(&description)
        .bind(&created)
        .bind(unit)
        .bind(unit_price as i64)
        .execute(&mut tx)
        .await
        .map_err(map_to_std)?;

    for attachment in attachments.iter() {
        let _ = sqlx::query(include_str!("save_attachments.sql"))
            .bind(&id)
            .bind(attachment)
            .execute(&mut tx)
            .await
            .map_err(map_to_std)?;
    }

    tx.commit().await.map_err(map_to_std)?;

    Ok(())
}
