-- Add up migration script here
drop view account_names;
drop view accounts;

-- A view that list transactions against accounts
create view account_transactions as
select trim(fromAccount) as account,
       id,
       trim(toAccount) as oppositeAccount,
       0 - amount  as amount,
       transDate,
       updatedDate,
       description
from transactions
union all
select trim(toAccount) as account,
       id,
       trim(fromAccount) as oppositeAccount,
       amount    as amount,
       transDate,
       updatedDate,
       description
from transactions;

-- Recreate account_names
create view account_names(name) as
    select distinct account collate nocase from account_transactions;

-- Recreate accounts
create view accounts(name, balance, lastTransDate) as
    select account, sum(amount), max(transDate)
    from account_transactions
    group by account collate nocase;

-- Create a view that shows daily sum of an account
create view daily_sum as
    select account, sum(amount) as total, transDate
    from account_transactions
    group by account collate nocase, transDate;