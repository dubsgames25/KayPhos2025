package repositories

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

//
//✅ What This Tests
//- InsertCustomMeal() → saves a user-defined favorite meal
//- InsertLoggedMeal() → logs a real meal with ingredients + totals
//- GetMealsByUserID() → retrieves meals by user ID and mealType
//- DeleteMealByName() → removes a named meal for a user
//
//🧪 What’s Covered in This Pattern
//✅ Database interaction (insert → retrieve → delete)
//✅ Distinct mealType handling: "favorite" vs "history"
//✅ Basic model integrity (Ingredient + MealEntry)
//
//🧪 What’s NOT Covered
//❌ Foreign key constraints (users table assumed dummy-safe)
//❌ Time-based queries (mealTime filtering)
//❌ Duplicate handling (inserts overwrite not tested)

func createRandomTestUser(t *testing.T, pool *pgxpool.Pool) *models.User {
	user := &models.User{
		FirstName:     "Test",
		LastName:      "User",
		UserName:      "testuser_" + uuid.NewString(), // randomize to avoid duplicates
		InputPassword: "password123",
	}
	err := user.SetHashedPassword()
	assert.NoError(t, err)
	user.SetUserID()

	err = CreateUser(pool, user)
	assert.NoError(t, err)
	return user
}

func TestInsertAndRetrieveCustomMeal(t *testing.T) {
	pool := SetupTestDB(t)

	user := createRandomTestUser(t, pool)

	ingredients := []models.Ingredient{
		{Name: "Tofu", Grams: 150, Calories: 120, Protein: 15, Carbs: 5, Phosphorus: 100, Potassium: 300},
		{Name: "Broccoli", Grams: 100, Calories: 50, Protein: 5, Carbs: 10, Phosphorus: 50, Potassium: 200},
	}

	err := InsertCustomMeal(pool, user.UserID, "My Favorite Tofu Bowl", time.Now(), ingredients)
	assert.NoError(t, err)

	meals, err := GetMealsByUserID(pool, user.UserID, "favorite")
	assert.NoError(t, err)
	assert.NotEmpty(t, meals)

	found := false
	for _, m := range meals {
		if m.MealName == "My Favorite Tofu Bowl" {
			found = true
			break
		}
	}
	assert.True(t, found, "Inserted custom meal not found")
}

func TestInsertAndDeleteLoggedMeal(t *testing.T) {
	pool := SetupTestDB(t)

	user := createRandomTestUser(t, pool)

	ingredients := []models.Ingredient{
		{Name: "Chicken", Grams: 200, Calories: 300, Protein: 30, Carbs: 0, Phosphorus: 200, Potassium: 400},
	}

	err := InsertLoggedMeal(pool, user.UserID, "Lunch Chicken", time.Now(), ingredients)
	assert.NoError(t, err)

	meals, err := GetMealsByUserID(pool, user.UserID, "history")
	assert.NoError(t, err)
	assert.NotEmpty(t, meals)

	err = DeleteMealByName(pool, user.UserID, "Lunch Chicken")
	assert.NoError(t, err)
}
