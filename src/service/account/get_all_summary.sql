SELECT A.*,
       ((SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE toAccount = A.name COLLATE NOCASE AND transDate < ?1) -
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE fromAccount = A.name COLLATE NOCASE AND transDate < ?1)) as balance
FROM accounts AS A;


