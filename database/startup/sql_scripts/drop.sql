-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     -- Loop over all tables in the public schema
--     FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
--         EXECUTE 'DROP TABLE IF EXISTS public.' || r.tablename || ' CASCADE';
--     END LOOP;
-- END $$;

-- create table foundation_food_items
-- as select
-- foundation_food.fdc_id,
-- food.description
-- -- food_portion.gram_weight
-- -- nutrient.name,
-- -- food_nutrient.amount
-- -- nutrient.unit_name
-- from
-- foundation_food join food on foundation_food.fdc_id = food.fdc_id;
-- -- join food_portion on foundation_food.fdc_id = food_portion.fdc_id;
-- -- foundation_food join food_portion on foundation_food.fdc_id = food_portion.fdc_id;

-- -- join food_nutrient on foundation_food.fdc_id = food_nutrient.fdc_id and
-- -- food_nutrient.nutrient_id in (1092,1091);
-- -- join nutrient on food_nutrient.nutrient_id = nutrient.id where nutrient_id in (1091,1092);

-- alter table foundation_food_items add column K text;

-- update foundation_food_items
-- set K = food_nutrient.amount
-- from food_nutrient where foundation_food_items.fdc_id = food_nutrient.fdc_id and
-- food_nutrient.nutrient_id = 1092;
