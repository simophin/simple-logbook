-- Add up migration script here

create table imports (
    id text primary key,
    uploaded_at timestamp not null,
    file_name text not null
);

create table import_transactions (
    import_id text not null references imports(id),
    transaction_id text not null references transactions(id),
    primary key (import_id, transaction_id)
);

create index import_transactions_import_id_idx on import_transactions(import_id);
create index import_transactions_transaction_id_idx on import_transactions(transaction_id);


create table mappings (
    
);