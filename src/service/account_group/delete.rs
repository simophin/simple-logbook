use super::models::*;
use crate::state::AppState;
use serde_derive::*;

pub type Input = Vec<AccountGroup>;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    success: usize,
}

pub async fn execute(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let mut tx = state.conn.begin().await?;
    let mut success = 0;
    for AccountGroup {
        account_name,
        group_name,
    } in input
    {
        success += sqlx::query("DELETE FROM account_groups WHERE accountName = ? AND groupName = ?")
            .bind(account_name)
            .bind(group_name)
            .execute(&mut tx)
            .await?
            .rows_affected() as usize;
    }
    tx.commit().await?;

    Ok(Output { success })
}
