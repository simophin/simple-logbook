-- Add up migration script here
create table config_values (
    name text primary key,
    value text
);

insert into config_values
select name, value from configs;

drop table configs;

create table configs(
    name text not null,
    id text not null,
    value text,
    primary key (name, id)
);

create index configs_name on configs(name);
create index configs_id on configs(id);

insert into configs
select name, '' as id, value from config_values;

drop table config_values;