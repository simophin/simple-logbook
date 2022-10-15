use crate::{
    service::{GenericUpdateResponse, Result},
    state::AppState,
};

use super::models::AccountGroup;

pub async fn execute(state: &AppState, groups: Vec<AccountGroup>) -> Result<GenericUpdateResponse> {
    let mut tx = state.conn.begin().await?;
    let mut num_affected: u64 = 0;

    for AccountGroup {
        group_name,
        accounts,
    } in groups
    {
        num_affected += sqlx::query(
            "insert into account_groups_view (groupName, accounts) values (trim(?), ?)",
        )
        .bind(group_name)
        .bind(accounts)
        .execute(&mut tx)
        .await?
        .rows_affected();
    }

    tx.commit().await?;
    Ok(GenericUpdateResponse {
        num_affected: num_affected as usize,
    })
}
