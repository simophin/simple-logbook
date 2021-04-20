table! {
    transactions (id) {
        id -> Text,
        desc -> Text,
        from_account -> Text,
        to_account -> Text,
        amount -> Double,
        trans_date -> Timestamp,
        created -> Timestamp,
    }
}
