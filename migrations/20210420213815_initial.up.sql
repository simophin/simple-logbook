-- Add up migration script here
create table transactions
(
    id          text           not null primary key,
    desc        text           not null collate nocase,
    fromAccount text           not null collate nocase,
    toAccount   text           not null collate nocase,
    amount      decimal(10, 2) not null,
    transDate   datetime       not null,
    createdDate datetime       not null default current_timestamp
);

create index transactions_from_account on transactions (fromAccount);
create index transactions_to_account on transactions (toAccount);
create index transactions_created on transactions (createdDate);
create index transactions_desc on transactions (desc);
create index transactions_trans_date on transactions (transDate);
create index transactions_amount on transactions (amount);

insert into transactions (id, desc, fromAccount, toAccount, amount, transDate)
VALUES ('id1', 'hello, world', 'Account 1', 'Account 2', 123.02, current_timestamp);

insert into transactions (id, desc, fromAccount, toAccount, amount, transDate)
VALUES ('id2', 'give you back world', 'Account 2', 'Account 1', 123.02, current_timestamp);