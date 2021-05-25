select distinct subCategory collate nocase
from work_logs
where ?1 is null or trim(?1) = '' or subCategory like '%' || ?1 || '%' collate nocase