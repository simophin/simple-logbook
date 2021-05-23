select id, mimeType, name, created, lastUpdated from attachments
where id in (select value from json_each(?1))