select t.*,
       (select json_group_array(a.id)
        from attachments a
                 inner join transaction_attachments ta on ta.attachmentId = a.id
        where ta.transactionId = t.id
        order by a.ROWID) as attachments
from transactions as t
where (?4 = '[]' or ?4 is null or trim(t.fromAccount) in (select value from json_each(?4)) or
       trim(t.toAccount) in (select value from json_each(?4)))
  and (?1 is null or ?1 = '' or t.description like '%' || ?1 || '%')
  and (?2 is null or ?2 = '' or t.transDate >= ?2)
  and (?3 is null or ?3 = '' or t.transDate <= ?3)
order by t.transDate desc
limit ?5, ?6