package repositories

import (
	"context"
	"github.com/google/uuid"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"log"
	"time"
)

// InsertMeal inserts a single meal record for a user into the meals table
func InsertMeal(dbPool DBClient, userID uuid.UUID, foodCode int, mealTime time.Time) error {
	_, err := dbPool.Exec(context.Background(),
		`INSERT INTO meals (user_id, food_code, time) VALUES ($1, $2, $3);`,
		userID, foodCode, mealTime)
	log.Printf("📦 Inserting ingredient:")
	return err
}

// GetMealsByUserID fetches all meals for a given user ID
func GetMealsByUserID(dbPool DBClient, userID uuid.UUID, mealType string) ([]models.MealGroup, error) {
	query := `
	SELECT meal_name, time, ingredients
	FROM meals
	WHERE user_id = $1 AND meal_type = $2
	ORDER BY time DESC;
	`

	rows, err := dbPool.Query(context.Background(), query, userID, mealType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var meals []models.MealGroup
	for rows.Next() {
		var m models.MealGroup
		if err := rows.Scan(&m.MealName, &m.Time, &m.Ingredients); err != nil {
			return nil, err
		}
		// MealType is constant for all rows, fill it
		m.MealType = mealType

		meals = append(meals, m)
	}
	return meals, nil
}

func InsertCustomMeal(dbPool DBClient, userID uuid.UUID, mealName string, mealTime time.Time, ingredients []models.Ingredient) error {
	// Calculate totals from ingredients
	var totalK, totalP, totalCals, totalPro, totalCarbs float64
	for _, ing := range ingredients {
		totalK += ing.Potassium
		totalP += ing.Phosphorus
		totalCals += ing.Calories
		totalPro += ing.Protein
		totalCarbs += ing.Carbs
	}

	totals := map[string]float64{
		"potassium":  totalK,
		"phosphorus": totalP,
		"calories":   totalCals,
		"protein":    totalPro,
		"carbs":      totalCarbs,
	}

	_, err := dbPool.Exec(context.Background(), `
		INSERT INTO meals (user_id, meal_name, time, meal_type, ingredients, totals)
		VALUES ($1, $2, $3, 'favorite', $4, $5);
	`, userID, mealName, mealTime, ingredients, totals)

	log.Printf("💾 InsertCustomMeal (favorite): name=%s user=%s time=%v", mealName, userID, mealTime)
	return err
}

type DailyNutrientTotals struct {
	Date        time.Time `json:"date"`
	Potassium   float64   `json:"potassiumTotal"`
	Phosphorous float64   `json:"phosphorousTotal"`
}

func FetchNutrientHistory(db DBClient, userID uuid.UUID, start, end string) ([]DailyNutrientTotals, error) {
	query := `
		SELECT 
			DATE(time) AS date,
			SUM((totals->>'potassium')::float) AS potassium,
			SUM((totals->>'phosphorus')::float) AS phosphorous
		FROM meals
		WHERE user_id = $1 AND meal_type = 'history' AND time BETWEEN $2 AND $3
		GROUP BY DATE(time)
		ORDER BY DATE(time)
	`

	rows, err := db.Query(context.Background(), query, userID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []DailyNutrientTotals
	for rows.Next() {
		var d DailyNutrientTotals
		if err := rows.Scan(&d.Date, &d.Potassium, &d.Phosphorous); err != nil {
			return nil, err
		}
		results = append(results, d)
	}
	return results, nil
}

func InsertLoggedMeal(dbPool DBClient, userID uuid.UUID, mealName string, mealTime time.Time, ingredients []models.Ingredient) error {
	// Calculate totals
	var totalK, totalP, totalCals, totalPro, totalCarbs float64
	for _, ing := range ingredients {
		totalK += ing.Potassium
		totalP += ing.Phosphorus
		totalCals += ing.Calories
		totalPro += ing.Protein
		totalCarbs += ing.Carbs
	}

	totals := map[string]float64{
		"potassium":  totalK,
		"phosphorus": totalP,
		"calories":   totalCals,
		"protein":    totalPro,
		"carbs":      totalCarbs,
	}

	_, err := dbPool.Exec(context.Background(), `
		INSERT INTO meals (user_id, meal_name, time, meal_type, ingredients, totals)
		VALUES ($1, $2, $3, 'history', $4, $5);
	`, userID, mealName, mealTime, ingredients, totals)

	return err
}

func DeleteMealByName(dbPool DBClient, userID uuid.UUID, mealName string) error {
	cmdTag, err := dbPool.Exec(context.Background(),
		`DELETE FROM meals WHERE user_id = $1 AND meal_name = $2;`,
		userID, mealName)

	log.Printf("🧹 Deleted %d rows for meal name: %s", cmdTag.RowsAffected(), mealName)
	return err
}
