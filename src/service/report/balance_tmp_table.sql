create temporary table tmp_account_names (
    name text primary key not null on conflict replace
);