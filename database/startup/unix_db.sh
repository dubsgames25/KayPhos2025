#!/bin/zsh

# Check if Homebrew is installed
if ! command -v brew &> /dev/null
then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew is already installed."
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null
then
    echo "PostgreSQL not found. Installing PostgreSQL..."
    brew install postgresql@17
else
    echo "PostgreSQL is already installed."
fi

# Optionally, start PostgreSQL service if it's installed
if command -v psql &> /dev/null
then
    echo "Starting PostgreSQL service..."
    brew services start postgresql@17
fi

# drop kayphos database
dropdb kayphos

# create kayphos database
createdb kayphos

# install python helper tools
PACKAGES=("xlsx2csv" "csvkit" "psycopg2")

# Loop through each package and check if it's installed
for PACKAGE in "${PACKAGES[@]}"; do
    if ! pip show "$PACKAGE" > /dev/null 2>&1; then
        echo "$PACKAGE is not installed. Installing..."
        pip install "$PACKAGE"
    else
        echo "$PACKAGE is already installed."
    fi
done

# delete all xlsx files in directory
# rm -rf fndds_data/*.xlsx

# delete all csv files in directory
# rm -rf fndds_data/*.csv

# create fndds_data directory
mkdir -p fndds_data

# download food item dataset
if [ ! -f "fndds_data/2021-2023%20FNDDS%20At%20A%20Glance%20-%20FNDDS%20Nutrient%20Values.xlsx" ]; then
   curl -o fndds_data/2021-2023%20FNDDS%20At%20A%20Glance%20-%20FNDDS%20Nutrient%20Values.xlsx https://www.ars.usda.gov/ARSUserFiles/80400530/apps/2021-2023%20FNDDS%20At%20A%20Glance%20-%20FNDDS%20Nutrient%20Values.xlsx
fi

# convert xlsx to csv
if [ ! -f "fndds_data/fndds_nutrient_values.csv " ]; then
    xlsx2csv fndds_data/2021-2023%20FNDDS%20At%20A%20Glance%20-%20FNDDS%20Nutrient%20Values.xlsx fndds_data/fndds_nutrient_values.csv
fi

# remove title lines from csv file
sed -i '' '1,2d' fndds_data/fndds_nutrient_values.csv

# drop all relations in db
# psql -d kayphos -f sql_scripts/drop.sql

# import csv to postgres
# TODO: CHANGE STRING TO YOUR POSTGRES DB
USER=$(whoami)
csvsql --insert --db "postgresql://$USER@localhost/kayphos" fndds_data/fndds_nutrient_values.csv

# create new column with GIN index on "Main food description" column
psql -d kayphos -f sql_scripts/gin_index.sql

# create trigram index on "Main food description" column
psql -d kayphos -f sql_scripts/trigram_index.sql

# enforce unique on food code column of fndds
psql -d kayphos -f sql_scripts/unique_food_code.sql

# create user table
psql -d kayphos -f sql_scripts/user_table.sql

# create meal table
psql -d kayphos -f sql_scripts/meal_table.sql

# create user sessions table
psql -d kayphos -f sql_scripts/user_sessions.sql
