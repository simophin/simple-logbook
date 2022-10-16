use std::borrow::Cow;

use crate::service::{self, PaginatedResponse, SortOrder, ToSQL};
use crate::sqlx_ext::Json;
use chrono::{DateTime, NaiveDate, Utc};
use serde::Deserialize;

#[derive(Deserialize, Clone, Copy, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SortField {
    Created,
    Updated,
    Size,
}

type Sort = service::Sort<SortField>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    #[serde(default = "default_sorts")]
    pub sorts: Cow<'static, [Sort]>,

    pub q: Option<String>,
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,

    pub includes: Option<Json<Vec<String>>>,
    pub accounts: Option<Json<Vec<String>>>,
    pub tags: Option<Json<Vec<String>>>,

    #[serde(default = "default_with_data")]
    pub with_data: bool,
}

const fn default_with_data() -> bool {
    false
}

const fn default_sorts() -> Cow<'static, [Sort]> {
    Cow::Borrowed(DEFAULT_SORTS)
}

const fn default_limit() -> i64 {
    50
}

impl Default for Input {
    fn default() -> Self {
        Self {
            limit: default_limit(),
            sorts: default_sorts(),
            q: Default::default(),
            from: Default::default(),
            to: Default::default(),
            offset: Default::default(),
            includes: Default::default(),
            accounts: Default::default(),
            tags: Default::default(),
            with_data: Default::default(),
        }
    }
}

const DEFAULT_SORTS: &'static [Sort] = &[
    Sort::new(SortField::Created, SortOrder::DESC),
    Sort::new(SortField::Updated, SortOrder::DESC),
];

impl ToSQL for SortField {
    fn to_sql(&self) -> Option<&str> {
        Some(match self {
            SortField::Created => "created",
            SortField::Updated => "lastUpdated",
            SortField::Size => "length(data)",
        })
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
select id, 
    mimeType, 
    name, 
    created, 
    lastUpdated,
    iif(?1, dataHash, null) as dataHash, 
    iif(?1, data, null) as data from attachments
where 
    (?2 is null or name like '%' || trim(?2) || '%' collate nocase)
    and (?3 is null or created >= ?3)
    and (?4 is null or created <= ?4)
    and (?5 is null or id in (select trim(value) from json_each(?5)))
    and (
        ?6 is null 
        or json_array_length(?6) == 0
        or id in (
            select attachmentId from account_attachments where account in 
                (select trim(value) from json_each(?6))) collate nocase 
    )
    )
    and (
        ?7 is null 
        or json_array_length(?7) == 0 
        or id in (
            select ta.attachmentId from transaction_attachments ta
            inner join transactions t on t.id = ta.transactionId
            inner join transaction_tags tt on tt.transactionId = t.id
            where tt.tag in (select trim(value) from json_each(?7)) collate nocase
        )
    )
"#;

    use crate::{
        bind_sqlite_args,
        service::{query::create_paginated_query, PaginatedResponse, Result},
        state::AppState,
    };

    use super::{Attachment, Input};

    pub async fn execute(state: &AppState, input: Input) -> Result<PaginatedResponse<Attachment>> {
        let (data, (total,)) = create_paginated_query(
            &state.conn,
            SQL,
            bind_sqlite_args!(
                input.with_data,
                &input.q,
                &input.from,
                &input.to,
                &input.includes,
                &input.accounts,
                &input.tags
            ),
            input.limit,
            input.offset,
            &input.sorts,
            "COUNT(*)",
        )
        .await?;
        Ok(PaginatedResponse { data, total })
    }
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
