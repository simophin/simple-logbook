-- Add up migration script here
create table work_logs
(
    id          text     not null primary key,
    category    text     not null collate nocase,
    subCategory text     not null collate nocase default '',
    description text     not null collate nocase default '',
    created     datetime not null                default current_timestamp,
    unit        integer  not null,
    unitPrice   integer  not null,
    check ( trim(category) != '' ),
    check ( unit > 0 ),
    check ( unitPrice >= 0 )
);

create index work_log_category on work_logs (category collate nocase);
create index work_log_sub_category on work_logs (subCategory collate nocase);
create index work_log_categories on work_logs (category collate nocase, subCategory collate nocase);

create table work_log_attachments
(
    workLogId    text not null references work_logs (id) on delete cascade,
    attachmentId text not null references attachments (id) on delete cascade
);

create table invoices
(
    id      integer primary key autoincrement,
    created timestamp not null default current_timestamp,
    dueDate date      not null,
    header  text,
    footer  text
);

create table invoice_taxes
(
    invoiceId  integer not null references invoices (id) on delete cascade,
    name       text    not null collate nocase,
    amountType text    not null collate nocase,
    amount     integer not null,
    check ( trim(name) != ''),
    check ( amountType in ('percentage', 'absolute') ),
    check (
            (amountType = 'percentage' and amount >= 0 and amount <= 100) or
            (amountType = 'absolute' and amount >= 0)
        )
);

create table invoice_items
(
    invoiceId integer not null references invoices (id) on delete cascade,
    workLogId text    not null references work_logs (id) on delete cascade,
    primary key (invoiceId, workLogId)
);

create index invoice_items_invoice_id on invoice_items (invoiceId);
create index invoice_items_work_log_id on invoice_items (workLogId);

create table invoice_attachments
(
    invoiceId    integer not null references invoices (id) on delete cascade,
    attachmentId text    not null references attachments (id) on delete cascade,
    primary key (invoiceId, attachmentId)
);

create index invoice_attachments_invoice_id on invoice_attachments (invoiceId);
create index invoice_attachments_attachment_id on invoice_attachments (attachmentId);

drop view attachment_ref_counts;

create view attachment_ref_counts as
select a.id, (count(ta.transactionId) + count(wla.workLogId) + count(ia.invoiceId)) as refCount, lastUpdated
from attachments a
         left join transaction_attachments ta on a.id = ta.attachmentId
         left join work_log_attachments wla on a.id = wla.attachmentId
         left join invoice_attachments ia on a.id = ia.attachmentId
group by a.id;
