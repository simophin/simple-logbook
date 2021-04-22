SELECT name FROM accounts
WHERE name LIKE (?1 || '%')
UNION
SELECT name FROM accounts
WHERE name LIKE ('%' || ?1 || '%')
UNION
SELECT name FROM accounts
WHERE name LIKE ('%' || ?1)