-- fndds_nutrient_values_test.sql

DROP TABLE IF EXISTS fndds_nutrient_values CASCADE;

CREATE TABLE fndds_nutrient_values (
    "Food code" numeric PRIMARY KEY,
    "Main food description" varchar NOT NULL,
    "WWEIA Category number" numeric NOT NULL,
    "WWEIA Category description" varchar NOT NULL,
    "Energy (kcal)" numeric NOT NULL,
    "Protein (g)" numeric NOT NULL,
    "Carbohydrate (g)" numeric NOT NULL,
    "Sugars, total (g)" numeric NOT NULL,
    "Potassium (mg)" numeric NOT NULL,
    "Phosphorus (mg)" numeric NOT NULL
);

-- 🍌 Banana
INSERT INTO fndds_nutrient_values VALUES
(1111, 'Banana', 5000, 'Fruits', 89, 1.1, 23, 12, 358, 22);

-- 🥦 Broccoli
INSERT INTO fndds_nutrient_values VALUES
(2222, 'Broccoli', 6000, 'Vegetables', 34, 2.8, 7, 2, 316, 66);

-- 🧈 Tofu
INSERT INTO fndds_nutrient_values VALUES
(3333, 'Tofu', 7000, 'Vegetarian Products', 76, 8.1, 1.9, 0.5, 118, 190);
