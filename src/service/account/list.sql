select *
from accounts
where (?1 is null or trim(?1) = '' or name like '%' || trim(?1) || '%' collate nocase)
  and (?2 is null or trim(?2) = '' or name in (select value from json_each(?2)))