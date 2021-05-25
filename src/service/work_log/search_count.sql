select count(wl.id)
from work_logs as wl
where ((?1 is null) or (?1 = '') or (wl.description like '%' || ?1 || '%' collate nocase))
  and ((?2 is null) or (?2 = '') or (wl.created >= ?2))
  and ((?3 is null) or (?3 = '') or (wl.created <= ?3))
  and ((?4 is null) or (?4 = '') or (wl.category in (select value from json_each(?4))))
  and ((?5 is null) or (?5 = '') or (wl.subCategory in (select value from json_each(?5))))