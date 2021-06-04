use super::model::Item;

//language=sql
crate::execute_sql_impl!(
    Item,
    "insert into invoice_items_view (id, invoiceId, description, category, subCategory, unit, unitPrice, date, notes, attachments) 
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    invoice_id,
    description,
    category,
    sub_category,
    unit,
    unit_price,
    date,
    notes,
    attachments
);
