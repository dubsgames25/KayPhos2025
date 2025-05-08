alter table fndds_nutrient_values
add column description tsvector;

update fndds_nutrient_values
set description = to_tsvector('english', "Main food description");

create index idx_gin_description
on fndds_nutrient_values
using gin (description);
