-- Add up migration script here
drop view attachment_ref_counts;

drop table invoices;
drop table invoice_items;
drop table invoice_taxes;
drop table invoice_attachments;
drop table work_logs;
drop table work_log_attachments;