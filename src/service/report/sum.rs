use crate::sqlx_ext::Json;
use chrono::NaiveDate;

#[derive(serde::Deserialize)]
pub struct Input {
    from: Option<NaiveDate>,
    to: Option<NaiveDate>,
    freq: Json<super::Frequency>,
    accounts: Json<Vec<String>>,
}

#[derive(serde::Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DataPoint {
    total: i64,
    time_point: String,
}

//language=sql
const SQL: &str = r#"
select sum(ds.total) as total,
       strftime(?4, ds.transDate) as time_point
from daily_sum ds
where 
      (?1 is null or ds.transDate >= ?1) and
      (?2 is null or ds.transDate <= ?2) and
      ds.account in (select value from json_each(?3))
group by time_point
order by time_point
"#;

crate::list_sql_impl!(Input, DataPoint, query_as, SQL, from, to, accounts, freq);
