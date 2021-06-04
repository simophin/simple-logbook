-- Add up migration script here

-- Invoice table and its indexes
create table invoices
(
    id            text     not null primary key,
    client        text     not null,
    clientDetails text     not null,
    date          datetime not null default current_timestamp,
    dueDate       datetime not null,
    companyName   text     not null,
    notes         text     not null,
    paymentInfo   text     not null,
    reference     integer  not null,
    deleted       boolean  not null default false
);
create index invoices_client on invoices (client);
create unique index invoices_reference on invoices (reference);

-- Invoice extra info
create table invoice_extra_info
(
    invoiceId text    not null references invoices (id) on delete cascade,
    name      text    not null,
    value     text    not null,
    priority  integer not null,
    primary key (invoiceId, name)
);
create index invoice_extra_info_invoiceId on invoice_extra_info (invoiceId);
create unique index invoice_extra_info_invoiceId_priority on invoice_extra_info (invoiceId, priority);

-- Invoice additional charge table and its indexes
create table invoice_extra_charges
(
    invoiceId   text    not null references invoices (id) on delete cascade,
    name        text    not null check ( trim(name) != '' ),
    description text    not null,
    priority    integer not null default 0,
    type        text    not null check ( type in ('absolute', 'percent') collate nocase ),
    amount      integer not null,
    primary key (invoiceId, name)
);
create index invoice_extra_charges_invoiceId on invoice_extra_charges (invoiceId);
create unique index invoice_extra_charges_unique_priority on invoice_extra_charges (invoiceId, priority);

-- Invoice items and its indexes
create table invoice_items
(
    id          text     not null primary key,
    invoiceId   text     references invoices (id) on delete set null,
    description text     not null,
    category    text     not null check ( trim(category) != '' ),
    subCategory text     not null,
    unit        integer  not null check ( unit > 0 ),
    unitPrice   integer  not null,
    date        datetime not null default current_timestamp,
    notes       text     not null
);
create index invoice_items_invoiceId on invoice_items (invoiceId);
create index invoice_items_category on invoice_items (category);
create index invoice_items_subCategory on invoice_items (subCategory);
create index invoice_items_description on invoice_items (description);


-- Invoice item attachments
create table invoice_item_attachments
(
    invoiceItemId text not null references invoice_items (id) on delete cascade,
    attachmentId  text not null references attachments (id) on delete cascade,
    primary key (invoiceItemId, attachmentId)
);
create index invoice_item_attachments_invoiceItemId on invoice_item_attachments (invoiceItemId);
create index invoice_item_attachments_attachmentId on invoice_item_attachments (attachmentId);

-- Invoice item view
create view invoice_items_view as
select ii.*,
       (select json_group_array(attachmentId)
        from invoice_item_attachments iia
        where iia.invoiceItemId = ii.id) as attachments
from invoice_items ii;

create trigger invoice_items_view_insert
    instead of insert
    on invoice_items_view
begin
    insert or
    replace
    into invoice_items(id, invoiceId, description, category, subCategory, unit, unitPrice, notes)
    values (NEW.id, NEW.invoiceId, trim(NEW.description), trim(NEW.category), trim(NEW.subCategory), NEW.unit,
            NEW.unitPrice, trim(NEW.notes));

    delete from invoice_item_attachments where invoiceItemId = NEW.id;

    insert into invoice_item_attachments (invoiceItemId, attachmentId)
    select NEW.id, a.id
    from json_each(NEW.attachments) j
             inner join attachments a on j.value = a.id;
end;


-- Invoice attachments and its indexes
create table invoice_attachments
(
    invoiceId    text not null references invoices (id) on delete cascade,
    attachmentId text not null references attachments (id) on delete cascade,
    primary key (invoiceId, attachmentId)
);
create index invoice_attachments_invoiceId on invoice_attachments (invoiceId);
create index invoice_attachments_attachmentId on invoice_attachments (attachmentId);

-- Invoice amount view
create view invoice_amount_view (invoiceId, amount) as
select id,
       (with recursive
            charges(seq, type, amount) as (select row_number() over (order by priority), type, amount
                                           from invoice_extra_charges
                                           where invoiceId = invoices.id
                                           order by priority),

            invoice_sum(seq, sum) as (
                select 0, sum(unit * unitPrice) / 100
                from invoice_items
                where invoiceId = invoices.id
                union all
                select invoice_sum.seq + 1,
                       case type
                           when 'percent' then invoice_sum.sum * (100 + amount) / 100
                           else invoice_sum.sum + amount
                           end
                from charges,
                     invoice_sum
                where charges.seq = invoice_sum.seq + 1
            )
        select sum
        from invoice_sum
        order by seq desc
        limit 1) as amount
from invoices;

-- Invoice views
create view invoices_view as
select i.*,
       (select amount from invoice_amount_view where invoiceId = i.id)                                  as amount,
       (select json_group_array(json_object(
               'name', iac.name,
               'description', iac.description,
               'priority', iac.priority,
               'type', iac.type,
               'amount', iac.amount
           ))
        from invoice_extra_charges iac
        where iac.invoiceId = i.id)                                                                     as extraCharges,
       (select json_group_array(json_object(
               'name', iei.name,
               'value', iei.value,
               'priority', iei.priority
           ))
        from invoice_extra_info iei
        where iei.invoiceId = i.id)                                                                     as extraInfo,
       (select json_group_array(ii.id) from invoice_items ii where ii.invoiceId = i.id)                 as items,
       (select json_group_array(ia.attachmentId) from invoice_attachments ia where ia.invoiceId = i.id) as attachments
from invoices i;

create trigger invoices_view_insert
    instead of insert
    on invoices_view
begin
    --  Delete the old value first
    delete from invoices where invoices.id = NEW.id;

    --     Insert into the main table
    insert or
    replace
    into invoices
    (id, client, clientDetails, date, dueDate, companyName, notes, reference, paymentInfo)
    values (NEW.id, trim(NEW.client), trim(NEW.clientDetails), NEW.date, NEW.dueDate, trim(NEW.companyName),
            trim(NEW.notes), (select ifnull(max(reference), 0) + 1 from invoices), trim(NEW.paymentInfo));

-- Replace all extra charges
    insert or
    replace
    into invoice_extra_charges(invoiceId, name, description, priority, type, amount)
    select NEW.id,
           trim(json_extract(value, '$.name')),
           trim(json_extract(value, '$.description')),
           json_extract(value, '$.priority'),
           json_extract(value, '$.type'),
           json_extract(value, '$.amount')
    from json_each(NEW.extraCharges);

-- Replace all extra info
    insert or
    replace
    into invoice_extra_info(invoiceId, name, value, priority)
    select NEW.id,
           trim(json_extract(value, '$.name')),
           trim(json_extract(value, '$.value')),
           json_extract(value, '$.priority')
    from json_each(NEW.extraInfo);

-- Replace all invoice items
    update invoice_items set invoiceId = NEW.id where id in (select value from json_each(NEW.items));

-- Replace all attachments
    insert or
    replace into invoice_attachments (invoiceId, attachmentId)
    select NEW.id, a.id
    from attachments a
             inner join json_each(NEW.attachments) j on a.id = j.value;
end;

-- Re-create attachment_ref_counts
create view attachment_references as
select a.id,
       a.lastUpdated,
       count(ta.transactionId) + count(iia.invoiceItemId) + count(ia.invoiceId) as numReferences
from attachments a
         left join transaction_attachments ta on a.id = ta.attachmentId
         left join invoice_item_attachments iia on a.id = iia.attachmentId
         left join invoice_attachments ia on a.id = ia.attachmentId
group by a.id;

-- Transaction view with trigger
create view transactions_view as
select t.*,
       (select json_group_array(ta.attachmentId)
        from transaction_attachments ta
        where ta.transactionId = t.id) as attachments
from transactions t;

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

-- Account group view with trigger
create view account_groups_view as
select groupName, json_group_array(accountName) as accounts
from account_groups
group by groupName collate nocase;

create trigger account_groups_view_insert
    instead of insert
    on account_groups_view
begin
    delete from account_groups where groupName = trim(NEW.groupName) collate nocase;

    insert or
    replace
    into account_groups(groupName, accountName)
    select trim(NEW.groupName), trim(value)
    from json_each(NEW.accounts);
end;
