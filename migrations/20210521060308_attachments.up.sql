-- Add up migration script here
create table attachments (
    id text not null primary key,
    mimeType text not null,
    name text not null,
    created timestamp not null default current_timestamp,
    lastUpdated timestamp not null default current_timestamp,
    dataHash blob,
    data blob
);

create index attachment_unique_data_hash on attachments(dataHash);

create table transaction_attachments(
    transactionId text not null references transactions(id) on delete cascade,
    attachmentId text not null references attachments(id) on delete cascade,
    primary key (transactionId, attachmentId)
);

create index transaction_attachments_tid on transaction_attachments(transactionId);
create index transaction_attachments_aid on transaction_attachments(attachmentId);

create view attachment_ref_counts as
    select a.id, count(ta.transactionId) refCount, lastUpdated from attachments a
    left join transaction_attachments ta on a.id = ta.attachmentId;
