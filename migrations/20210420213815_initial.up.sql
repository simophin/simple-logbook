-- Add up migration script here
create table transactions
(
    id          text     not null primary key,
    desc        text     not null collate nocase,
    fromAccount text     not null collate nocase,
    toAccount   text     not null collate nocase,
    amount      integer  not null,
    transDate   date     not null,
    updatedDate datetime not null default current_timestamp
);

create trigger transactions_no_same_account_insert
    before insert
    on transactions
    when trim(NEW.toAccount) = trim(NEW.fromAccount) collate nocase
begin
    select raise(abort, 'fromAccount == toAccount');
end;

create trigger transactions_no_same_account_update
    before update of fromAccount, toAccount
    on transactions
    when trim(NEW.toAccount) = trim(NEW.fromAccount) collate nocase
begin
    select raise(abort, 'fromAccount == toAccount');
end;

create index transactions_from_account on transactions (trim(fromAccount));
create index transactions_to_account on transactions (trim(toAccount));
create index transactions_updated on transactions (updatedDate);
create index transactions_desc on transactions (desc);
create index transactions_trans_date on transactions (transDate);
create index transactions_amount on transactions (amount);

create view accounts(name) as
select distinct trim(fromAccount) collate nocase
from transactions
union
select distinct trim(toAccount) collate nocase
from transactions;