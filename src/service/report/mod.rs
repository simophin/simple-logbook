pub mod balance;
pub mod sum;

use serde_derive::*;

#[derive(Deserialize)]
enum Frequency {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}
