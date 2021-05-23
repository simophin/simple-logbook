delete from transaction_attachments
where transactionId = ?1 and
      attachmentId not in (select value from json_each(?2))