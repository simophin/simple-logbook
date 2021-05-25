select distinct category collate nocase
from work_logs
where ?1 is null or trim(?1) = '' or category like '%' || ?1 || '%' collate nocase