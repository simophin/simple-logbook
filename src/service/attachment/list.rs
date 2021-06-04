use crate::service::CommonListRequest;
use crate::sqlx_ext::Json;
use chrono::{DateTime, Utc};

const fn default_with_data() -> bool {
    false
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    #[serde(flatten)]
    pub req: CommonListRequest,

    pub includes: Option<Json<Vec<String>>>,

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

//language=sql
const SQL: &str = r#"
select id, mimeType, name, created, lastUpdated,
       iif(?1, dataHash, null) as dataHash, iif(?1, data, null) as data from attachments
where 
      (?2 is null or name like '%' || trim(?2) || '%' collate nocase) and
      (?3 is null or created >= ?3) and 
      (?4 is null or created <= ?4) and
      (?5 is null or id in (select value from json_each(?5)))
order by created desc, lastUpdated desc, name
"#;

//language=sql
const COUNT_SQL: &str = r#"
select count(id) from attachments
where 
      (?2 is null or name like '%' || trim(?2) || '%' collate nocase) and
      (?3 is null or created >= ?3) and 
      (?4 is null or created <= ?4) and
      (?5 is null or id in (select value from json_each(?5)))
"#;

crate::list_sql_paginated_impl!(
    Input, Attachment, query_as, SQL, COUNT_SQL, offset, limit, with_data, q, from, to, includes
);
