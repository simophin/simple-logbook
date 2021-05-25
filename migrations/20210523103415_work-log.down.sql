-- Add down migration script here
drop view attachment_ref_counts;

create view attachment_ref_counts as
select a.id, count(ta.transactionId) refCount, lastUpdated
from attachments a
         left join transaction_attachments ta on a.id = ta.attachmentId;

drop table work_logs;
drop table work_log_attachments;
drop table invoice_items;
drop table invoice_taxes;
drop table invoice_attachments;
drop table invoices;