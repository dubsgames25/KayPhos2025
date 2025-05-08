package repositories

import (
	"context"
	"fmt"
	"strings"

	"github.com/kimsh02/kay-phos/server/gin/internal/models"
)

type Fndds struct{}

// FnddsQuery performs an websearch_to_tsquery for looser match on description
func (f Fndds) FnddsQuery(db DBClient, ingredientName string) (*[]models.FnddsFoodItem, error) {
	queries := permuteWords(ingredientName)
	for _, query := range queries {
		rows, err := db.Query(context.Background(), `
		SELECT "Food code", "Main food description", "Potassium (mg)", "Phosphorus (mg)", "Energy (kcal)" AS "Calories (kcal)", "Protein (g)", "Carbohydrate (g)"
		FROM fndds_nutrient_values
		WHERE to_tsvector('english', description || ' ' || "Main food description" || ' ' || "WWEIA Category description")
			  @@ plainto_tsquery('english', $1)
		ORDER BY ts_rank(
			to_tsvector('english', description || ' ' || "Main food description" || ' ' || "WWEIA Category description"),
			plainto_tsquery('english', $1)
		) DESC
		LIMIT 5;
		`, query)

		if err != nil {
			return nil, fmt.Errorf("query error: %w", err)
		}

		var items []models.FnddsFoodItem
		for rows.Next() {
			var item models.FnddsFoodItem
			err := rows.Scan(&item.FoodCode, &item.Description, &item.Potassium, &item.Phosphorus, &item.Calories, &item.Protein, &item.Carbs)
			if err != nil {
				return nil, fmt.Errorf("scan error: %w", err)
			}
			items = append(items, item)
		}
		if len(items) == 0 {
			fmt.Println("⚠️ No matches found in database for:", ingredientName)
		}
		if len(items) > 0 {
			return &items, nil
		}
	}
	return nil, nil
}

// helper function to rearrange food descriptions in case no match is found
func permuteWords(input string) []string {
	words := strings.Fields(input)
	var results []string
	n := len(words)

	// Return original if there's 1 or 0 words
	if n <= 1 {
		return []string{input}
	}

	// Simple permutations: rotate positions
	for i := 0; i < n; i++ {
		rotated := append(words[i:], words[:i]...)
		results = append(results, strings.Join(rotated, " "))
	}

	return results
}
