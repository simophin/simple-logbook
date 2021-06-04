use crate::service::CommonListRequest;
use crate::sqlx_ext::Json;

use super::model::Invoice;

const fn default_include_deleted() -> bool {
    return false;
}

#[derive(serde::Deserialize, Default)]
pub struct Input {
    #[serde(flatten)]
    req: CommonListRequest,
    includes: Option<Json<Vec<String>>>,
    #[serde(default = "default_include_deleted")]
    include_deleted: bool,
}

crate::impl_deref!(Input, req, CommonListRequest);

//language=sql
const SQL: &str = r#"
select iv.* from invoices_view iv
where (
    ?1 is null or 
    client like '%' || ?1 || '%' collate nocase or
    clientDetails like '%' || ?1 || '%' collate nocase or
    companyName like '%' || ?1 || '%' collate nocase or
    notes like '%' || ?1 || '%' collate nocase) and
    (?2 is null or date >= ?2) and
    (?3 is null or date <= ?3) and 
    (?4 is null or iv.id in (select value from json_each(?4))) and
    (?5 or deleted = false)
order by date desc, dueDate desc, client, companyName
"#;

//language=sql
const COUNT_SQL: &str = r#"
select count(iv.id) from invoices_view iv
where (
    ?1 is null or 
    client like '%' || ?1 || '%' collate nocase or
    clientDetails like '%' || ?1 || '%' collate nocase or
    companyName like '%' || ?1 || '%' collate nocase or
    notes like '%' || ?1 || '%' collate nocase) and
    (?2 is null or date >= ?2) and
    (?3 is null or date <= ?3) and 
    (?4 is null or iv.id in (select value from json_each(?4))) and
    (?5 or deleted = false)
"#;

crate::list_sql_paginated_impl!(
    Input,
    Invoice,
    query_as,
    SQL,
    COUNT_SQL,
    offset,
    limit,
    q,
    from,
    to,
    includes,
    include_deleted
);
