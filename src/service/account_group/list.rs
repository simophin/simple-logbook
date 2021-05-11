use super::models::AccountGroup;
use crate::state::AppState;
use serde_derive::*;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    group_name: String,
    accounts: Vec<String>,
}

#[derive(Deserialize)]
pub struct Input {}
pub type Output = Vec<Group>;

pub async fn execute(state: &AppState, _: Input) -> anyhow::Result<Output> {
    let items: Vec<AccountGroup> = sqlx::query_as(include_str!("list.sql"))
        .fetch_all(&state.conn)
        .await?;

    let mut out = Vec::<Group>::new();
    for item in items {
        let AccountGroup {
            group_name,
            account_name,
        } = item;
        match out.last_mut() {
            Some(g) if g.group_name.eq_ignore_ascii_case(&group_name) => {
                g.accounts.push(account_name);
            }

            _ => {
                out.push(Group {
                    group_name,
                    accounts: vec![account_name],
                });
            }
        }
    }

    Ok(out)
}
