-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;

CREATE EXTENSION pg_trgm;

CREATE INDEX idx_trgm_description
ON fndds_nutrient_values
USING gin ("Main food description" gin_trgm_ops);
