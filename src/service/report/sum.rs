use crate::state::AppState;
use itertools::Itertools;
use serde_derive::*;

#[derive(Deserialize)]
pub struct Input {
    from: Option<String>,
    to: Option<String>,
    freq: super::Frequency,
    accounts: Vec<String>,
}

#[derive(Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DataPoint {
    total: i64,
    time_point: String,
}

pub type Output = Vec<DataPoint>;

pub async fn query(state: &AppState, input: Input) -> anyhow::Result<Output> {
    let Input {
        from,
        to,
        freq,
        accounts,
    } = input;

    if accounts.is_empty() {
        return Ok(vec![]);
    }

    let mut condition = String::from("1");
    let mut binding = Vec::new();

    if let Some(from) = from {
        condition += " and (b.transDate >= ?)";
        binding.push(from);
    }

    if let Some(to) = to {
        condition += " and (b.transDate <= ?)";
        binding.push(to);
    }

    condition += " and b.account in (";
    condition += &(0..accounts.len()).into_iter().map(|_| "?").join(",");
    condition += ")";
    binding.extend_from_slice(&accounts);

    let time_format = match freq {
        super::Frequency::Daily => "%Y-%j",
        super::Frequency::Weekly => "%Y-%W",
        super::Frequency::Monthly => "%Y-%m",
        super::Frequency::Yearly => "%Y",
    };

    let sql = format!(
        "
        select
           sum(b.total) as total,
           strftime(?, b.transDate) as time_point
        from daily_sum b
        where {}
        group by strftime(?, b.transDate)
        order by time_point asc
    ",
        condition
    );

    Ok(binding
        .into_iter()
        .fold(sqlx::query_as(sql.as_str()).bind(&time_format), |q, b| {
            q.bind(b)
        })
        .bind(time_format)
        .fetch_all(&state.conn)
        .await?)
}
