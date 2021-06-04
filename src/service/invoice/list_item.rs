use super::model::Item;
use crate::sqlx_ext::Json;
use chrono::NaiveDate;

const fn default_limit() -> i64 {
    return -1;
}

#[derive(serde::Deserialize, Debug, Clone, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub q: Option<String>,
    pub from: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    pub invoice_ids: Option<Json<Vec<String>>>,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

impl Default for Input {
    fn default() -> Self {
        Self {
            q: None,
            from: None,
            to: None,
            invoice_ids: None,
            limit: default_limit(),
        }
    }
}

//language=sql
const SQL: &str = r#"
select * from invoice_items_view
where 
      (?1 is null or description like '%' || ?1 || '%' collate nocase) and
      (?2 is null or date >= ?2) and
      (?3 is null or date <= ?3) and
      (
          ?4 is null or
          (?4 = '[]' and invoiceId is null) or
          (invoiceId in (select value from json_each(?4)))
    )
order by date desc, category, subCategory, description
limit ?5
"#;

crate::list_sql_impl!(Input, Item, query_as, SQL, q, from, to, invoice_ids, limit);
