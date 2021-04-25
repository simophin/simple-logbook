-- Add up migration script here
drop view accounts;

create view account_names(name) as
select distinct trim(fromAccount) collate nocase
from transactions
union
select distinct trim(toAccount) collate nocase
from transactions;

create view accounts (name, balance, lastTransDate) as
    select AN.name,
               ((SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE toAccount = AN.name COLLATE NOCASE) -
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE fromAccount = AN.name COLLATE NOCASE)) as balance,
           (select transDate from transactions where toAccount = AN.name or fromAccount = AN.name order by transDate desc limit 1) as lastTransDate
    from account_names AN