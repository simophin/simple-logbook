-- Add down migration script here
drop trigger transactions_view_insert;

create trigger transactions_view_insert
    instead of insert
    on transactions_view
begin
    insert or
    replace
    into transactions(id, description, fromAccount, toAccount, amount, transDate, updatedDate)
    values (NEW.id, trim(NEW.description), trim(NEW.fromAccount), trim(NEW.toAccount), NEW.amount, NEW.transDate,
            NEW.updatedDate);

    delete from transaction_attachments where transactionId = NEW.id;

    insert into transaction_attachments(transactionId, attachmentId)
    select NEW.id, a.id
    from attachments a
             inner join json_each(NEW.attachments) j on j.value = a.id;
end;