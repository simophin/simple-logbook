
create table charts (
    id text primary key,
    name text not null,
    isAccumulated integer not null default false,
    groupByDateFormat text not null,
    lastUpdated datetime not null default current_timestamp,
    chartType text not null
);

create table chart_series(
    id text primary key,
    chartId text references charts(id) on delete cascade,
    name text not null,
    ord integer not null,
    color integer,
    isIncome integer not null default false
);
create index chart_series_chart_id on chart_series(chartId);


create table chart_series_criteria(
    id text primary key,
    seriesId text references chart_series(id),
    type text not null check ( type = 'account' or type = 'tag' or type = 'accountGroup' or type = 'desc' ),
    value text not null
);
create index chart_series_criteria_series_id on chart_series_criteria(seriesId);
create index chart_series_criteria_series_id_type on chart_series_criteria(seriesId, type);

--- Views
create view chart_series_details as
    select s.*,
           (select json_group_array(json_object(
               'id', c.id,
               'type', c.type,
               'value', c.value
               )) from chart_series_criteria c where c.seriesId = s.id) as criteria
    from chart_series s;

create view chart_details as
    select c.*,
           (select json_group_array(json_object(
               'id', s.id,
               'name', s.name,
               'ord', s.ord,
               'color', s.color,
               'isIncome', s.isIncome,
               'criteria', s.criteria
               )) from chart_series_details s where s.chartId = c.id) as series
    from charts as c