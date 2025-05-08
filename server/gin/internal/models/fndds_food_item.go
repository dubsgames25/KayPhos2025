package models

/*
 * Fndds_Food_Item is the food item model for the FNDDS foods from usda.gov, a
 * Fndds_Food_Item can only be retrieved from the database
 */

type FnddsFoodItem struct {
	FoodCode    int     `json:"Food Code"`
	Description string  `json:"Description"`
	Potassium   float64 `json:"Potassium (mg)"`
	Phosphorus  float64 `json:"Phosphorus (mg)"`
	Calories    float64 `json:"Calories"`
	Protein     float64 `json:"Protein (g)"`
	Carbs       float64 `json:"Carbohydrate (g)"`
}
