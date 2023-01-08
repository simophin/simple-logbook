use chrono::NaiveDate;
use sqlx::query_as;

use crate::{service::Result, sqlx_ext::Json, state::AppState};

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

pub async fn execute(
    state: &AppState,
    Input {
        from,
        to,
        freq,
        accounts,
    }: Input,
) -> Result<Vec<DataPoint>> {
    Ok(query_as(SQL)
        .bind(from)
        .bind(to)
        .bind(accounts)
        .bind(freq)
        .fetch_all(&state.conn)
        .await?)
}
