-- Add down migration script here
drop view account_groups_view;
drop view transactions_view;
drop view attachment_references;
drop table invoice_attachments;
drop view invoice_items_view;
drop view invoices_view;
drop view invoice_amount_view;
drop table invoice_item_attachments;
drop table invoice_items;
drop table invoice_extra_charges;
drop table invoice_extra_info;
drop table invoices;