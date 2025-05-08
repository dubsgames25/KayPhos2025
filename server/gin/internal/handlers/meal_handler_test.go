package handlers_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/kimsh02/kay-phos/server/gin/internal/handlers"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/kimsh02/kay-phos/server/gin/test/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestInsertMealHistory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything).
		Return(pgconn.CommandTag{}, nil)

	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.POST("/dashboard/api/user-meal-history", app.InsertMealHistory)

	ingredients := []models.Ingredient{
		{
			Name:       "Banana",
			Grams:      100,
			Calories:   89,
			Protein:    1.1,
			Carbs:      23,
			Potassium:  358,
			Phosphorus: 22,
		},
	}

	payload := models.MealGroup{
		MealName:    "TestMeal",
		Time:        time.Now(),
		MealType:    "history",
		Ingredients: ingredients,
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/dashboard/api/user-meal-history", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 201, w.Code)
}

func TestGetMealHistory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Query", mock.Anything, mock.Anything, mock.Anything).
		Return(new(testutils.MockRows), nil)

	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.GET("/dashboard/api/user-meal-history", app.GetMealHistory)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/api/user-meal-history", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestDeleteMealEntry_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(pgconn.CommandTag{}, nil)

	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.DELETE("/dashboard/api/user-meal-history", app.DeleteMealEntry)

	payload := map[string]string{
		"mealName": "TestMeal",
		"mealTime": time.Now().Format(time.RFC3339),
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/dashboard/api/user-meal-history", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestInsertMealHistory_InvalidPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.POST("/dashboard/api/user-meal-history", app.InsertMealHistory)

	invalidPayload := []byte(`{"invalid": true}`)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/dashboard/api/user-meal-history", bytes.NewBuffer(invalidPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestDeleteMealEntry_InvalidPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.DELETE("/dashboard/api/user-meal-history", app.DeleteMealEntry)

	invalidPayload := []byte(`{"invalid": true}`)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/dashboard/api/user-meal-history", bytes.NewBuffer(invalidPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestInsertMealHistory_InvalidClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.POST("/dashboard/api/user-meal-history", app.InsertMealHistory)

	payload := []byte(`{"mealName":"BadMeal"}`)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/dashboard/api/user-meal-history", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestInsertMealHistory_BadRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.POST("/dashboard/api/user-meal-history", app.InsertMealHistory)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/dashboard/api/user-meal-history", bytes.NewBuffer([]byte(`{invalid json`)))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestInsertMealHistory_InsertFails(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything).Return(pgconn.CommandTag{}, errors.New("db error"))

	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.POST("/dashboard/api/user-meal-history", app.InsertMealHistory)

	ingredients := []models.Ingredient{
		{
			Name:       "Banana",
			Grams:      100,
			Calories:   89,
			Protein:    1.1,
			Carbs:      23,
			Potassium:  358,
			Phosphorus: 22,
		},
	}

	payload := models.MealGroup{
		MealName:    "TestMeal",
		Time:        time.Now(),
		MealType:    "history",
		Ingredients: ingredients,
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/dashboard/api/user-meal-history", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
}

func TestGetMealHistory_InvalidClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	app := &handlers.App{DB: mockDB}

	router := gin.New()
	router.GET("/dashboard/api/user-meal-history", app.GetMealHistory)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/api/user-meal-history", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 401, w.Code)
}

func TestGetMealHistory_QueryFails(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Query", mock.Anything, mock.Anything, mock.Anything).
		Return(new(testutils.MockRows), errors.New("db query failed"))

	app := &handlers.App{DB: mockDB}

	router := gin.New()

	// Prepare the fake claims
	fakeClaims := &models.Claims{
		UserID: uuid.New().String(),
	}

	// Define a fake middleware that sets the claims
	router.Use(func(c *gin.Context) {
		c.Set("claims", fakeClaims)
		c.Next()
	})

	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.GET("/dashboard/api/user-meal-history", app.GetMealHistory)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/api/user-meal-history", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
}
