#!/bin/bash
set -e

echo "🧪 Rebuilding test database: kayphos_test..."

psql -h db -U postgres -c "DROP DATABASE IF EXISTS kayphos_test;"
psql -h db -U postgres -c "CREATE DATABASE kayphos_test;"

# Initialize schema into test DB
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/user_table.sql
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/meal_table.sql
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/user_sessions.sql

# Optional: load FNDDS nutrient data
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/fndds_nutrient_values_test.sql

# Indexes
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/gin_index.sql
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/trigram_index.sql
psql -h db -U postgres -d kayphos_test -f ./database/startup/sql_scripts/unique_food_code.sql

psql -h db -U postgres -d kayphos_test -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

echo "✅ kayphos_test is ready."
