package models

import "time"

/*
 * Meal is the model for meals that a user records in kayphos, a Meal can be
 * created, updated, or retrieved from the database
 */

type Ingredient struct {
	Name       string  `json:"name"`
	Grams      float64 `json:"grams"`
	Calories   float64 `json:"calories"`
	Protein    float64 `json:"protein"`
	Carbs      float64 `json:"carbs"`
	Phosphorus float64 `json:"phosphorus"`
	Potassium  float64 `json:"potassium"`
}

type MealGroup struct {
	MealName    string       `json:"mealName"`
	Time        time.Time    `json:"time"`
	MealType    string       `json:"mealType"`
	Ingredients []Ingredient `json:"ingredients"`
}

type MealEntry struct {
	MealName   string    `json:"mealName"`
	Time       time.Time `json:"time"`
	Name       string    `json:"name"`
	Grams      float64   `json:"grams"`
	Calories   float64   `json:"calories"`
	Protein    float64   `json:"protein"`
	Carbs      float64   `json:"carbs"`
	Phosphorus float64   `json:"phosphorus"`
	Potassium  float64   `json:"potassium"`
}
