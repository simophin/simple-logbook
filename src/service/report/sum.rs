use chrono::NaiveDate;

use crate::sqlx_ext::Json;

#[derive(serde::Deserialize)]
pub struct Input {
    from: Option<NaiveDate>,
    to: Option<NaiveDate>,
    freq: super::Frequency,
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
       (case ?4 
           when 'Weekly' collate nocase then strftime('%Y-%W', ds.transDate) 
           when 'Monthly' collate nocase then strftime('%Y-%m', ds.transDate) 
           when 'Yearly' collate nocase then strftime('%Y', ds.transDate)
           else strftime('%Y-%j', ds.transDate)
        end) as time_point
from daily_sum ds
where 
      (?1 is null or ds.transDate >= ?1) and
      (?2 is null or ds.transDate <= ?2) and
      ds.account in (select trim(value) from json_each(?3)) collate nocase
group by time_point
order by time_point
"#;

crate::list_sql_impl!(Input, DataPoint, query_as, SQL, from, to, accounts, freq);
