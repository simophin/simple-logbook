-- Add up migration script here
create table transactions
(
    id          text     not null primary key,
    description text     not null collate nocase check ( length(trim(description)) > 0 ),
    fromAccount text     not null collate nocase check ( length(trim(fromAccount)) > 0 ),
    toAccount   text     not null collate nocase check ( length(trim(toAccount)) > 0 ),
    amount      integer  not null,
    transDate   date     not null,
    updatedDate datetime not null default current_timestamp,
    check ( trim(fromAccount) != trim(toAccount) collate nocase)
);

create index transactions_from_account on transactions (trim(fromAccount));
create index transactions_to_account on transactions (trim(toAccount));
create index transactions_updated on transactions (updatedDate);
create index transactions_desc on transactions (description);
create index transactions_trans_date on transactions (transDate);
create index transactions_amount on transactions (amount);

create view accounts(name) as
select distinct trim(fromAccount) collate nocase
from transactions
union
select distinct trim(toAccount) collate nocase
from transactions;