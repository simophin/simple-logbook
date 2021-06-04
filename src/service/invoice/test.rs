use std::time::SystemTime;

use chrono::DateTime;
use itertools::Itertools;
use uuid::Uuid;

use crate::service::attachment::test::new_attachment;
use crate::sqlx_ext::Json;
use crate::state::AppState;

use super::*;

pub fn normalised_item(mut item: model::Item) -> model::Item {
    item.attachments.sort();
    item
}

pub async fn new_item(state: &AppState) -> model::Item {
    let item = model::Item {
        id: Uuid::new_v4().to_string(),
        invoice_id: None,
        description: "desc".to_string(),
        category: "cat1".to_string(),
        sub_category: "cat2".to_string(),
        unit: 123,
        unit_price: 123,
        date: DateTime::from(SystemTime::now()),
        notes: "notes".into(),
        attachments: Json(vec![
            new_attachment(state).await.0,
            new_attachment(state).await.0,
        ]),
    };

    save_item::execute(state, item.clone())
        .await
        .expect("To save an item");
    item
}

pub fn normalise_invoice(mut item: model::Invoice) -> model::Invoice {
    item.attachments.sort();
    item.items.sort();
    item.extra_charges.sort_by(|lhs, rhs| {
        lhs.priority
            .cmp(&rhs.priority)
            .then(lhs.name.cmp(&rhs.name))
    });
    item.extra_info.sort_by_key(|v| v.name.clone());
    item
}

pub async fn new_invoice(state: &AppState, id: Option<String>) -> model::Invoice {
    use model::*;
    let invoice = Invoice {
        attachments: Json(vec![
            new_attachment(state).await.0,
            new_attachment(state).await.0,
        ]),
        extra_charges: Json(vec![
            ExtraCharge {
                description: "desc".into(),
                priority: 1,
                name: "charge1".into(),
                amount_type: ExtraChargeType::Percent,
                amount: 15,
            },
            ExtraCharge {
                description: "desc".into(),
                priority: 2,
                name: "charge2".into(),
                amount_type: ExtraChargeType::Absolute,
                amount: 150,
            },
        ]),
        items: Json(vec![
            new_item(state).await.id,
            new_item(state).await.id,
            new_item(state).await.id,
            new_item(state).await.id,
        ]),
        id: id.unwrap_or(Uuid::new_v4().to_string()),
        client_details: "Address1".into(),
        client: "Address1".into(),
        notes: "notes".into(),
        company_name: "Company name".into(),
        date: SystemTime::now().into(),
        due_date: SystemTime::now().into(),
        extra_info: Json(vec![
            ExtraInfo {
                name: "Info1".into(),
                value: "Value1".into(),
                priority: 1,
            },
            ExtraInfo {
                name: "Info2".into(),
                value: "".into(),
                priority: 2,
            },
        ]),
        payment_info: "To account".to_string(),
        amount: 845,
        reference: 1,
    };
    let _ = super::save::execute(state, invoice.clone())
        .await
        .expect("To save");
    invoice
}

#[async_std::test]
async fn invoice_works() {
    let state = AppState::new_test().await;

    // Test if we can save/read invoice
    let invoice = new_invoice(&state, None).await;
    let saved = list::execute(&state, Default::default())
        .await
        .expect("To list");
    assert_eq!(saved.data.len(), 1);
    assert_eq!(saved.total, 1);
    let saved = saved.data.into_iter().next().unwrap();
    assert_eq!(normalise_invoice(invoice.clone()), normalise_invoice(saved));

    // Test the items are written correctly
    let items = list_item::execute(&state, Default::default())
        .await
        .expect("To list items");
    let items = items.into_iter().map(|v| v.id).sorted().collect_vec();
    assert_eq!(items, normalise_invoice(invoice.clone()).items.0);

    // Test item query
    let items = list_item::execute(
        &state,
        list_item::Input {
            q: None,
            from: None,
            to: None,
            invoice_ids: Some(Json(vec![])),
            limit: -1,
        },
    )
    .await
    .expect("To list items");
    assert_eq!(items.len(), 0);

    // Deleting
    delete::execute(
        &state,
        delete::Input {
            ids: Json(vec![invoice.id.clone()]),
        },
    )
    .await
    .expect("To delete invoice");

    let rs = list::execute(&state, Default::default())
        .await
        .expect("To list");

    assert_eq!(rs.total, 0);
    assert_eq!(rs.data.len(), 0);
}
