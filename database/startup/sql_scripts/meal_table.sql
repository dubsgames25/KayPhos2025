-- DROP TABLE IF EXISTS meals;

CREATE TABLE meals (
                       id SERIAL PRIMARY KEY,
                       user_id UUID NOT NULL REFERENCES users(user_id),
                       meal_name TEXT NOT NULL,
                       time TIMESTAMPTZ DEFAULT now(),
                       meal_type TEXT CHECK (meal_type IN ('favorite', 'history')) NOT NULL,
                       ingredients JSONB NOT NULL,
                       totals JSONB NOT NULL
);

CREATE INDEX idx_meals_user_id ON meals(user_id);
