use std::collections::BTreeSet;

use serde_derive::*;

use crate::state::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupWithAccounts {
    group_name: String,
    accounts: Vec<String>,
}

pub type Input = Vec<GroupWithAccounts>;

#[derive(Serialize)]
pub struct Output {
    success: usize,
}

pub async fn execute(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let mut tx = state.conn.begin().await?;
    let mut success = 0;

    for group in input
        .iter()
        .map(|x| x.group_name.as_str())
        .collect::<BTreeSet<_>>()
        .into_iter()
    {
        let _ = sqlx::query("DELETE FROM account_groups WHERE groupName = TRIM(?) COLLATE NOCASE")
            .bind(group)
            .execute(&mut tx)
            .await?;
    }

    for GroupWithAccounts {
        group_name,
        accounts,
    } in input
    {
        for account in accounts {
            let rs = sqlx::query(
                "INSERT INTO account_groups (groupName, accountName) VALUES (TRIM(?), TRIM(?))",
            )
            .bind(&group_name)
            .bind(account)
            .execute(&mut tx)
            .await?;
            success += rs.rows_affected() as usize;
        }
    }
    let _ = tx.commit().await?;
    Ok(Output { success })
}
