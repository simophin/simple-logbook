-- Add down migration script here
create table config_values
(
    name  text primary key,
    value text
);

insert into config_values
select name, value
from configs;

drop table configs;

create table configs
(
    name  text not null primary key on conflict replace,
    value text not null
);

insert or replace into configs
select name, value
from config_values;

drop table config_values;