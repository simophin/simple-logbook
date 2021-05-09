with recursive cnt(i) as (
    select (?1) as d
    union all
    select date(i, '+1 day') as d
    from cnt
    limit ?2
)
select AN.name as account,
       cnt.i                        as balanceDate,
       ((SELECT COALESCE(SUM(amount), 0)
         FROM transactions
         WHERE toAccount = AN.name COLLATE NOCASE
           AND transDate <= cnt.i) -
        (SELECT COALESCE(SUM(amount), 0)
         FROM transactions
         WHERE fromAccount = AN.name COLLATE NOCASE
           AND transDate <= cnt.i)) as balance
from tmp_account_names AN
         left join cnt
order by AN.name, balanceDate