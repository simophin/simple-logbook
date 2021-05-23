-- Add down migration script here
drop view attachment_ref_counts;
drop table transaction_attachments;
drop table attachments;