pub mod balance;
pub mod sum;

#[derive(serde::Deserialize, sqlx::Type)]
enum Frequency {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}
