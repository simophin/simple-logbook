use crate::service::{CommonListRequest, PaginatedResponse};
use crate::sqlx_ext::Json;
use chrono::{DateTime, Utc};
use itertools::Itertools;

const fn default_with_data() -> bool {
    false
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    #[serde(flatten)]
    pub req: CommonListRequest,

    pub includes: Option<Json<Vec<String>>>,

    pub accounts: Option<Json<Vec<String>>>,

    #[serde(default = "default_with_data")]
    pub with_data: bool,
}

crate::impl_deref!(Input, req, CommonListRequest);

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Attachment {
    pub id: String,
    pub mime_type: String,
    pub name: String,
    pub created: DateTime<Utc>,
    pub last_updated: DateTime<Utc>,
    pub data: Option<Vec<u8>>,
    pub data_hash: Option<Vec<u8>>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AttachmentSigned {
    pub signed_id: Signed<'static>,

    #[serde(flatten)]
    pub attachment: Attachment,
}

mod sql {
    //language=sql
    const SQL: &str = r#"
with account_attachments(account, attachmentId) as (
    select a.name, ta.attachmentId from accounts a 
    inner join account_transactions tx on tx.account = a.name
    inner join transaction_attachments ta on ta.transactionId = tx.id
)
select id, mimeType, name, created, lastUpdated,
       iif(?1, dataHash, null) as dataHash, iif(?1, data, null) as data from attachments
where 
      (?2 is null or name like '%' || trim(?2) || '%' collate nocase) and
      (?3 is null or created >= ?3) and 
      (?4 is null or created <= ?4) and
      (?5 is null or id in (select value from json_each(?5))) and
      (?6 is null or ?6 = '[]' or id in (select attachmentId from account_attachments where account collate nocase in (select trim(value) from json_each(?6))))
order by created desc, lastUpdated desc, name
"#;

    //language=sql
    const COUNT_SQL: &str = r#"
with account_attachments(account, attachmentId) as (
    select a.name, ta.attachmentId from accounts a 
    inner join account_transactions tx on tx.account = a.name
    inner join transaction_attachments ta on ta.transactionId = tx.id
)
select count(id) from attachments
where 
      (?2 is null or name like '%' || trim(?2) || '%' collate nocase) and
      (?3 is null or created >= ?3) and 
      (?4 is null or created <= ?4) and
      (?5 is null or id in (select value from json_each(?5))) and
      (?6 is null or ?6 = '[]' or id in (select attachmentId from account_attachments where account collate nocase in (select trim(value) from json_each(?6))))
"#;

    use super::{Attachment, Input};
    crate::list_sql_paginated_impl!(
        Input, Attachment, query_as, SQL, COUNT_SQL, offset, limit, with_data, q, from, to,
        includes, accounts
    );
}

use crate::service::login::creds::{CredentialsConfig, Signed};
pub use sql::execute as execute_sql;

pub async fn execute(
    state: &crate::state::AppState,
    req: Input,
) -> crate::service::Result<crate::service::PaginatedResponse<AttachmentSigned>> {
    let c = CredentialsConfig::from_app(state)
        .await
        .ok_or_else(|| anyhow::anyhow!("No credentials set"))?;
    let PaginatedResponse { data, total } = execute_sql(state, req).await?;
    Ok(PaginatedResponse {
        data: data
            .into_iter()
            .map(|a| AttachmentSigned {
                signed_id: c.sign_asset(&a.id, "attachment"),
                attachment: a,
            })
            .collect_vec(),
        total,
    })
}
