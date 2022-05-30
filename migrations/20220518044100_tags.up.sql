-- Add up migration script here
create table transaction_tags (
    transactionId text not null references transactions(id) on delete cascade,
    tag text not null,
    primary key (transactionId, tag)
);

create index transaction_tag_tid on transaction_tags(transactionId);
create index transaction_tag_tag on transaction_tags(tag);

-- Update trigger to add transaction tag
drop trigger transactions_view_insert;

create trigger transactions_view_insert
    instead of insert
    on transactions_view
begin
    insert or
    replace
    into transactions(id, description, fromAccount, toAccount, amount, transDate, updatedDate, tags)
    values (NEW.id, trim(NEW.description), trim(NEW.fromAccount), trim(NEW.toAccount), NEW.amount, NEW.transDate,
            NEW.updatedDate);


    delete from transaction_attachments where transactionId = NEW.id;

    insert into transaction_attachments(transactionId, attachmentId)
    select NEW.id, a.id
    from attachments a
             inner join json_each(NEW.attachments) j on j.value = a.id;


    delete from transaction_tags where transactionId = NEW.id;

    insert into transaction_tags(transactionId, tag)
    select NEW.id, j.value from json_each(NEW.tags) j;
end;