package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/kimsh02/kay-phos/server/gin/internal/repositories"
	"github.com/kimsh02/kay-phos/server/gin/test/testutils"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockRows struct {
	index int
	data  []string
}

func (m *mockRows) Next() bool {
	m.index++
	return m.index <= len(m.data)
}
func (m *mockRows) Scan(dest ...any) error {
	if m.index == 0 || m.index > len(m.data) {
		return fmt.Errorf("index out of bounds")
	}
	*(dest[0].(*string)) = m.data[m.index-1]
	return nil
}
func (m *mockRows) Close()                                       {}
func (m *mockRows) Err() error                                   { return nil }
func (m *mockRows) CommandTag() pgconn.CommandTag                { return pgconn.CommandTag{} }
func (m *mockRows) Conn() *pgx.Conn                              { return nil }
func (m *mockRows) FieldDescriptions() []pgconn.FieldDescription { return nil }
func (m *mockRows) RawValues() [][]byte                          { return nil }
func (m *mockRows) Values() ([]any, error)                       { return nil, nil }

func TestCalculateIntake_Mocked(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// ✅ Mock FnddsRepo
	mockRepo := new(repositories.MockFnddsRepo)
	mockData := []models.FnddsFoodItem{
		{
			FoodCode:    1234,
			Description: "Banana",
			Potassium:   358,
			Phosphorus:  22,
			Calories:    89,
			Protein:     1.1,
			Carbs:       23,
		},
	}
	mockRepo.On("FnddsQuery", mock.Anything, "Banana").Return(&mockData, nil)

	app := &App{
		DB:        nil, // not used in this test
		FnddsRepo: mockRepo,
	}

	router := gin.New()
	router.POST("/calculate-intake", app.CalculateIntake)

	// 🔧 JSON input body
	payload := map[string]interface{}{
		"selectedFoods": []map[string]interface{}{
			{
				"ingredientName": "Banana",
				"weightGrams":    100,
			},
		},
	}
	body, _ := json.Marshal(payload)

	// 🚀 Send request
	req, _ := http.NewRequest("POST", "/calculate-intake", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// ✅ Verify
	assert.Equal(t, 200, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	totals := response["totals"].(map[string]interface{})
	assert.Equal(t, 358.0, totals["potassium"])
	assert.Equal(t, 22.0, totals["phosphorus"])
	assert.Equal(t, 89.0, totals["calories"])
}

func TestSearchFood_Mocked(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(repositories.MockFnddsRepo)
	mockData := []models.FnddsFoodItem{
		{
			FoodCode:    9876,
			Description: "Tofu",
			Potassium:   118,
			Phosphorus:  190,
			Calories:    76,
			Protein:     8.1,
			Carbs:       1.9,
		},
	}
	mockRepo.On("FnddsQuery", mock.Anything, "tofu").Return(&mockData, nil)

	app := &App{
		DB:        nil, // not used
		FnddsRepo: mockRepo,
	}

	router := gin.New()
	router.GET("/dashboard/search-food", app.SearchFood)

	req, _ := http.NewRequest("GET", "/dashboard/search-food?q=tofu", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var res map[string][]models.FnddsFoodItem
	err := json.Unmarshal(w.Body.Bytes(), &res)
	assert.NoError(t, err)

	assert.Len(t, res["results"], 1)
	assert.Equal(t, "Tofu", res["results"][0].Description)
}

func TestAutocompleteSuggestions_Mocked(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockSuggestions := &mockRows{
		data: []string{"Tofu", "Tofurkey"},
	}

	mockDB.On("Query", mock.Anything, mock.AnythingOfType("string"), mock.Anything).Return(mockSuggestions, nil)

	app := &App{
		DB:        mockDB,
		FnddsRepo: nil, // not used
	}

	router := gin.New()
	router.GET("/dashboard/autocomplete", app.AutocompleteSuggestions)

	req, _ := http.NewRequest("GET", "/dashboard/autocomplete?q=to", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var res map[string][]string
	err := json.Unmarshal(w.Body.Bytes(), &res)
	assert.NoError(t, err)

	assert.Len(t, res["suggestions"], 2)
	assert.Equal(t, "Tofu", res["suggestions"][0])
}
func TestGetFoodCode_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(repositories.MockFnddsRepo)
	mockRepo.On("FnddsQuery", mock.Anything, "banana").Return(&[]models.FnddsFoodItem{{Description: "banana", FoodCode: 1234}}, nil)

	app := &App{FnddsRepo: mockRepo}

	router := gin.New()
	router.GET("/dashboard/foodcode", app.GetFoodCode)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/foodcode?name=banana", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestGetFoodCode_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(repositories.MockFnddsRepo)
	mockRepo.On("FnddsQuery", mock.Anything, "nonexistent").Return(&[]models.FnddsFoodItem{}, nil)

	app := &App{FnddsRepo: mockRepo}

	router := gin.New()
	router.GET("/dashboard/foodcode", app.GetFoodCode)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/foodcode?name=nonexistent", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 404, w.Code)
}

func TestGetLoggedMeals_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Query", mock.Anything, mock.Anything, mock.Anything).Return(new(testutils.MockRows), nil)

	app := &App{DB: mockDB}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.GET("/dashboard/api/user-logged-meals", app.GetLoggedMeals)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/api/user-logged-meals", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestGetNutrientHistory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Query", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(new(testutils.MockRows), nil)

	app := &App{DB: mockDB}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.GET("/dashboard/nutrient-history", app.GetNutrientHistory)

	w := httptest.NewRecorder()
	// Assume we pass start and end query params
	req, _ := http.NewRequest("GET", "/dashboard/nutrient-history?start=2024-01-01&end=2025-01-01", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestGetCurrentUserInfo_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(new(testutils.MockRows))

	app := &App{DB: mockDB}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.GET("/dashboard/current-user-info", app.GetCurrentUserInfo)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/current-user-info", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestInvalidPath_Returns401(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.NoRoute(InvalidPath)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/not-a-real-page", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 401, w.Code)
}

func TestCalculateIntake_DBQueryFails(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Query", mock.Anything, mock.Anything, mock.Anything).Return(new(testutils.MockRows), errors.New("db error"))
	app := &App{DB: mockDB}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.POST("/dashboard/calculate-intake", app.CalculateIntake)

	w := httptest.NewRecorder()
	body := []byte(`[{"name":"banana"}]`)
	req, _ := http.NewRequest("POST", "/dashboard/calculate-intake", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestAutocompleteSuggestions_DBQueryFails(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Query", mock.Anything, mock.Anything, mock.Anything).Return(new(testutils.MockRows), errors.New("db error"))
	app := &App{DB: mockDB}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.GET("/dashboard/autocomplete", app.AutocompleteSuggestions)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/dashboard/autocomplete?q=ban", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
}

func TestLoginUser_InvalidPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(testutils.MockDB)
	mockRepo.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(new(testutils.MockRows))
	app := &App{DB: mockRepo}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", &models.Claims{UserID: uuid.New().String()})
		c.Next()
	})
	router.POST("/dashboard/api/login", func(c *gin.Context) {
		MakeUserHandler(app.LoginUser)(c)
	})

	w := httptest.NewRecorder()
	body := []byte(`{"email":"test@test.com", "password":"wrongpass"}`)
	req, _ := http.NewRequest("POST", "/dashboard/api/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestLoginUser_DBQueryFails(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(nil)
	app := &App{DB: mockDB}

	router := gin.New()
	router.POST("/dashboard/api/login", func(c *gin.Context) {
		MakeUserHandler(app.LoginUser)(c)
	})

	w := httptest.NewRecorder()
	body := []byte(`{"email":"test@test.com", "password":"password"}`)
	req, _ := http.NewRequest("POST", "/dashboard/api/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestCreateUser_DBInsertFails(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("insert failed"))
	app := &App{DB: mockDB}

	router := gin.New()
	router.POST("/dashboard/api/new-account", func(c *gin.Context) {
		MakeUserHandler(app.CreateUser)(c)
	})

	w := httptest.NewRecorder()
	body := []byte(`{"firstName":"Test","email":"test@test.com","password":"password"}`)
	req, _ := http.NewRequest("POST", "/dashboard/api/new-account", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}
