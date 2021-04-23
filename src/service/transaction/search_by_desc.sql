SELECT t.* FROM "transactions" t
WHERE TRIM(t.desc) LIKE '%' || TRIM(?) || '%'
GROUP BY TRIM(t.desc) COLLATE NOCASE
ORDER BY transDate DESC, createdDate DESC
LIMIT 10