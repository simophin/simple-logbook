insert or
replace into work_logs (id, category, subCategory, description, created, unit, unitPrice)
values (?1, trim(?2), trim(?3), trim(?4), ?5, ?6, ?7)