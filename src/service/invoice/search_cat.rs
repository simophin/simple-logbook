const fn default_search_sub_category() -> bool {
    return false;
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    q: Option<String>,
    #[serde(default = "default_search_sub_category")]
    search_sub_category: bool,
}

//language=sql
crate::list_sql_impl!(
    Input,
    String,
    query_scalar,
    "
with items(value) as ( select iif(?2, subCategory, category) from invoice_items )
select distinct value from items 
where ?1 is null or trim(?1) = '' or value like '%' || trim(?1) || '%' collate nocase
",
    q,
    search_sub_category
);
