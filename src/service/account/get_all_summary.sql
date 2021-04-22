SELECT A.*,
       ((SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE toAccount = A.name COLLATE NOCASE AND transDate < ?) -
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE fromAccount = A.name COLLATE NOCASE AND transDate < ?)) as balance
FROM accounts AS A;


