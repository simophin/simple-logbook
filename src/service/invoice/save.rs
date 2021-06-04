use super::model::Invoice;

//language=sql
const SQL: &str = r#"
insert into invoices_view (id, client, clientDetails, date, dueDate, companyName, notes, 
                           extraCharges, extraInfo, items, notes, attachments, paymentInfo)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"#;

crate::execute_sql_impl!(
    Invoice,
    SQL,
    id,
    client,
    client_details,
    date,
    due_date,
    company_name,
    notes,
    extra_charges,
    extra_info,
    items,
    notes,
    attachments,
    payment_info
);
