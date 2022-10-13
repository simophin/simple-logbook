use crate::service::{CommonListRequest, PaginatedResponse, Sort, SortOrder, WithOrder};
use crate::sqlx_ext::Json;
use chrono::{DateTime, Utc};
use derive_more::Deref;
use serde::Deserialize;

const fn default_with_data() -> bool {
    false
}

#[derive(Deserialize, Deref)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    #[serde(flatten)]
    #[deref]
    pub req: CommonListRequest,

    pub includes: Option<Json<Vec<String>>>,

    pub accounts: Option<Json<Vec<String>>>,

    pub tags: Option<Json<Vec<String>>>,

    #[serde(default = "default_with_data")]
    pub with_data: bool,
}

const DEFAULT_SORTS: &'static [Sort] = &[
    Sort::new("created", SortOrder::DESC),
    Sort::new("updated", SortOrder::DESC),
];

impl WithOrder for Input {
    fn get_sorts(&self) -> &Option<Vec<Sort>> {
        &self.sorts
    }

    fn get_default_sorts() -> &'static [Sort] {
        DEFAULT_SORTS
    }

    fn map_to_db(input: &str) -> Option<&'static str> {
        match input {
            "created" => Some("created"),
            "updated" => Some("lastUpdated"),
            "size" => Some("length(data)"),
            _ => None,
        }
    }
}

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

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentSigned<'a> {
    #[serde(flatten)]
    pub attachment: Attachment,

    pub signed_id: Signed<'a>,
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
      (?6 is null or ?6 = '[]' or id in (select attachmentId from account_attachments where account collate nocase in (select trim(value) from json_each(?6)))) and
      (?7 is null or ?7 = '[]' or
        id in (
                select ta.attachmentId from transaction_attachments ta
                inner join transactions t on t.id = ta.transactionId
                inner join transaction_tags tt on tt.transactionId = t.id
                where tt.tag in (select value from json_each(?7)) collate nocase
            )
        )
"#;

    use super::{Attachment, Input};
    crate::list_sql_paginated_impl!(
        Input, Attachment, query_as, SQL, offset, limit, with_data, q, from, to, includes,
        accounts, tags
    );
}

use crate::service::login::creds::{CredentialsConfig, Signed};
use crate::AppState;
pub use sql::execute as execute_sql;

pub async fn execute(
    state: &AppState,
    input: Input,
) -> crate::service::Result<PaginatedResponse<AttachmentSigned<'static>>> {
    let config = CredentialsConfig::from_app(state).await;
    execute_sql(state, input).await.map(|data| {
        data.map(|attachment| AttachmentSigned {
            signed_id: super::sign::sign(&attachment.id, config.as_ref()),
            attachment,
        })
    })
}
