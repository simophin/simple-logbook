-- Add up migration script here
create table account_groups (
    id integer primary key autoincrement,
    groupName text not null check ( length(trim(groupName)) > 0 ),
    accountName not null check ( length(trim(accountName)) > 0 )
);

create unique index account_group_name_uniqueness on account_groups(groupName, accountName);
create index account_group_group on account_groups(groupName);
create index account_group_account on account_groups(accountName);