use crate::service::error::map_to_std;
use crate::state::AppState;
use chrono::{DateTime, Utc};

#[derive(serde::Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub q: Option<String>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub categories: Option<Vec<String>>,
    pub sub_categories: Option<Vec<String>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(serde::Serialize)]
pub struct Output {
    pub data: Vec<super::model::WorkLog>,
    pub total: usize,
    pub offset: usize,
    pub limit: usize,
}

pub async fn execute(
    state: &AppState,
    Input {
        q,
        from,
        to,
        categories,
        sub_categories,
        limit,
        offset,
    }: Input,
) -> crate::service::Result<Output> {
    let categories = categories.map(|v| serde_json::to_string(&v).unwrap());
    let sub_categories = sub_categories.map(|v| serde_json::to_string(&v).unwrap());
    let mut tx = state.conn.begin().await.map_err(map_to_std)?;
    let limit = limit.unwrap_or(50) as i64;
    let offset = offset.unwrap_or(0) as i64;

    let total: i64 = sqlx::query_scalar(include_str!("search_count.sql"))
        .bind(&q)
        .bind(&from)
        .bind(&to)
        .bind(&categories)
        .bind(&sub_categories)
        .fetch_one(&mut tx)
        .await
        .map_err(map_to_std)?;

    let data = sqlx::query_as(include_str!("search.sql"))
        .bind(&q)
        .bind(&from)
        .bind(&to)
        .bind(&categories)
        .bind(&sub_categories)
        .bind(offset)
        .bind(limit)
        .fetch_all(&mut tx)
        .await
        .map_err(map_to_std)?;

    Ok(Output {
        data,
        total: total as usize,
        offset: offset as usize,
        limit: limit as usize,
    })
}
