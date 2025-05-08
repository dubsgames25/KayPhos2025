package handlers

import (
	"context"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"math"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CalculateIntake Handler for POST /dashboard/calculate-intake
func (a *App) CalculateIntake(c *gin.Context) {
	var req struct {
		SelectedFoods []struct {
			IngredientName string  `json:"ingredientName"`
			WeightGrams    float64 `json:"weightGrams"`
		} `json:"selectedFoods"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var totalK, totalP, totalCar, totalC, totalPro float64
	var breakdown []gin.H

	for _, food := range req.SelectedFoods {
		if strings.TrimSpace(food.IngredientName) == "" || food.WeightGrams <= 0 {
			continue
		}

		items, err := a.FnddsRepo.FnddsQuery(a.DB, food.IngredientName)
		if err != nil || items == nil || len(*items) == 0 {
			// fallback: try first word (e.g., "lemon" from "lemon juice")
			words := strings.Fields(food.IngredientName)
			if len(words) > 0 {
				items, err = a.FnddsRepo.FnddsQuery(a.DB, words[0])
			}
		}

		if err != nil || items == nil || len(*items) == 0 {
			// skip bad food
			continue
		}

		best := (*items)[0]
		k := (best.Potassium / 100) * food.WeightGrams
		p := (best.Phosphorus / 100) * food.WeightGrams
		calories := (best.Calories / 100) * food.WeightGrams
		protein := (best.Protein / 100) * food.WeightGrams
		carbs := (best.Carbs / 100) * food.WeightGrams

		totalK += k
		totalP += p
		totalC += calories
		totalPro += protein
		totalCar += carbs

		breakdown = append(breakdown, gin.H{
			"ingredientName": food.IngredientName,
			"weightGrams":    food.WeightGrams,
			"potassium":      math.Round(k),
			"phosphorus":     math.Round(p),
			"calories":       math.Round(calories),
			"protein":        math.Round(protein),
			"carbs":          math.Round(carbs),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"breakdown": breakdown,
		"totals": gin.H{
			"potassium":  math.Round(totalK),
			"phosphorus": math.Round(totalP),
			"calories":   math.Round(totalC),
			"protein":    math.Round(totalPro),
			"carbs":      math.Round(totalCar),
		},
	})
}

// SearchFood Handler for GET /dashboard/search-food
func (a *App) SearchFood(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing query"})
		return
	}

	results, err := a.FnddsRepo.FnddsQuery(a.DB, query)
	if err != nil || results == nil || len(*results) == 0 {
		c.JSON(http.StatusOK, gin.H{"results": []models.FnddsFoodItem{}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": *results})
}

// AutocompleteSuggestions Handler for GET /dashboard/autocomplete
func (a *App) AutocompleteSuggestions(c *gin.Context) {
	prefix := c.Query("q")
	if len(prefix) < 2 {
		c.JSON(http.StatusOK, gin.H{"suggestions": []string{}})
		return
	}

	// Use a simpler LIKE query here (or ilike for case-insensitivity)
	rows, err := a.DB.Query(context.Background(), `
		SELECT DISTINCT "Main food description" FROM fndds_nutrient_values
		WHERE "Main food description" ILIKE $1
		LIMIT 10;`, prefix+"%")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}
	defer rows.Close()

	var suggestions []string
	for rows.Next() {
		var desc string
		err := rows.Scan(&desc)
		if err != nil {
			return
		}
		suggestions = append(suggestions, desc)
	}

	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}
