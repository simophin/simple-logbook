-- Add up migration script here
create table configs (
    name text not null primary key on conflict replace,
    value text not null
)