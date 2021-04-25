-- Add down migration script here
drop view account_names;

create view accounts(name) as
select distinct trim(fromAccount) collate nocase
from transactions
union
select distinct trim(toAccount) collate nocase
from transactions;