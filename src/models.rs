use diesel::Queryable;
use diesel::sql_types::Date;

#[derive(Queryable)]
pub struct Transaction {
    pub id: String,
    pub desc: String,
    pub from_account: String,
    pub to_account: String,
    pub amount: String,
    pub trans_date: Date,
    pub created: Date,
}