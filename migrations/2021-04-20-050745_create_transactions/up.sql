-- Your SQL goes here
create table transactions
(
    id           text     not null primary key,
    desc         text     not null collate nocase,
    from_account text     not null collate nocase,
    to_account   text     not null collate nocase,
    amount       numeric  not null,
    trans_date   datetime not null,
    created      datetime not null default current_timestamp
);

create index transactions_from_account on transactions (from_account);
create index transactions_to_account on transactions (to_account);
create index transactions_created on transactions (created);
create index transactions_desc on transactions (desc);
create index transactions_trans_date on transactions (trans_date);