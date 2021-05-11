select sum(ds.total) as total,
       strftime(?4, ds.transDate) as time_point
from daily_sum ds
where ds.transDate >= ?1 and ds.transDate <= ?2 and
      ds.account in (select value from json_each(?3))
group by time_point
order by time_point