package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/kimsh02/kay-phos/server/gin/internal/repositories"
)

type mealEntryRequest struct {
	MealName string    `json:"meal_name"`
	FoodCode int       `json:"foodCode"`
	Time     time.Time `json:"time"`
}

type mealInsertRequest struct {
	Entries []mealEntryRequest `json:"entries"`
}

const s = "Invalid user token"

// POST /dashboard/user-meal-history
func (app *App) InsertMealHistory(c *gin.Context) {
	claims := c.MustGet("claims").(*models.Claims)
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {

		c.JSON(http.StatusUnauthorized, gin.H{"error": s})
		return
	}

	// Grouped meal support (newer AI/manual flows)
	var grouped models.MealGroup
	if err := c.ShouldBindJSON(&grouped); err == nil && grouped.MealName != "" && len(grouped.Ingredients) > 0 {
		log.Printf("📥 Received grouped meal: %s (%s)", grouped.MealName, grouped.MealType)

		switch grouped.MealType {
		case "favorite":
			if err := repositories.InsertCustomMeal(app.DB, userID, grouped.MealName, grouped.Time, grouped.Ingredients); err != nil {
				log.Printf("❌ InsertCustomMeal failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save favorite meal"})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Favorite meal saved"})
			return

		case "history":
			if err := repositories.InsertLoggedMeal(app.DB, userID, grouped.MealName, grouped.Time, grouped.Ingredients); err != nil {
				log.Printf("❌ InsertLoggedMeal failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log meal"})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Meal logged to history"})
			return

		default:
			log.Println("❌ Unknown meal type:", grouped.MealType)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid meal type"})
			return
		}
	}

	// Debug: log full body if format is invalid
	raw, _ := c.GetRawData()
	log.Println("⚠️ Raw request body:", string(raw))

	c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid meal format"})
}

// GET /dashboard/foodcode?name=Banana
func (a *App) GetFoodCode(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing food name"})
		return
	}

	results, err := a.FnddsRepo.FnddsQuery(a.DB, name)
	if err != nil || results == nil || len(*results) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Food not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"foodCode":    (*results)[0].FoodCode,
		"description": (*results)[0].Description,
	})
}

// GET /dashboard/api/user-meal-history
func (a *App) GetMealHistory(c *gin.Context) {
	log.Println("🔍 GetMealHistory called...")

	claimsRaw, exists := c.Get("claims")
	if !exists {
		log.Println("❌ No claims found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	claims, ok := claimsRaw.(*models.Claims)
	if !ok {
		log.Printf("❌ Claims type mismatch: %#v\n", claimsRaw)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid token claims"})
		return
	}

	log.Println("✅ Claims extracted:", claims.UserID)

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		log.Println("❌ UUID parse error:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	meals, err := repositories.GetMealsByUserID(a.DB, userID, "favorite")
	if err != nil {
		log.Println("❌ Failed to fetch meals from DB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch meals"})
		return
	}

	log.Printf("✅ Returning %d meals\n", len(meals))
	c.JSON(http.StatusOK, meals)
}

func (a *App) GetLoggedMeals(c *gin.Context) {
	claims := c.MustGet("claims").(*models.Claims)
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": s})
		return
	}

	meals, err := repositories.GetMealsByUserID(a.DB, userID, "history")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logged meals"})
		return
	}

	c.JSON(http.StatusOK, meals)
}

// DELETE /dashboard/user-meal-history
func (app *App) DeleteMealEntry(c *gin.Context) {
	claims := c.MustGet("claims").(*models.Claims)
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": s})
		return
	}

	var req struct {
		MealName string `json:"mealName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.MealName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing meal name"})
		return
	}

	log.Printf("🧹 Deleting meal for user %s: mealName=%s\n", userID, req.MealName)

	err = repositories.DeleteMealByName(app.DB, userID, req.MealName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete meal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Meal deleted"})
}

func (a *App) GetNutrientHistory(c *gin.Context) {
	claims := c.MustGet("claims").(*models.Claims)
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	start := c.Query("start") + "T00:00:00"
	end := c.Query("end") + "T23:59:59"

	if start == "" || end == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing date range"})
		return
	}

	data, err := repositories.FetchNutrientHistory(a.DB, userID, start, end)
	if err != nil {
		log.Printf("❌ Failed to fetch nutrient history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nutrient history"})
		return
	}

	// ✅ Ensure we return [] even if no results
	if data == nil {
		data = []repositories.DailyNutrientTotals{}
	}

	c.JSON(http.StatusOK, data)
}
