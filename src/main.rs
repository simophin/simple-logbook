use diesel::{SqliteConnection, Connection, prelude::*};
use rocket::{get, State};
use rocket::http::RawStr;
use crate::models::Transaction;

mod schema;
mod models;

struct AppState {
    pub conn: SqliteConnection,
}

#[get("/transaction/search?<desc>")]
fn search_transaction_by_desc(state: State<AppState>, desc: &RawStr) -> Vec<Transaction> {
    use schema::transactions::dsl::*;
    transactions.filter(desc.like(desc.as_str()))
        .load(&state.conn)
        .expect("To load")
}

fn main() {
    let _ = dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be specified");

    let conn = SqliteConnection::establish(&database_url)
        .expect(&format!("Unable to open database connection to {}", &database_url));

    rocket::ignite()
        .manage(AppState {
            conn,
        });
}
