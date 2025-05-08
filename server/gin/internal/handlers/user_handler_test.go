package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/kimsh02/kay-phos/server/gin/test/testutils"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/kimsh02/kay-phos/server/gin/internal/models"
)

type MockRow struct {
	mock.Mock
}

func (m *MockRow) Scan(dest ...any) error {
	args := m.Called(dest...)
	return args.Error(0)
}

func TestLoginUser_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockRow := new(MockRow)

	// Setup the Scan behavior
	mockRow.On("Scan", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)

	// Setup DB to return our MockRow
	mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(mockRow)

	app := &App{
		DB: mockDB,
	}

	router := gin.New()
	router.POST("/", MakeUserHandler(app.LoginUser))

	hashed, _ := bcrypt.GenerateFromPassword([]byte("testpass"), bcrypt.DefaultCost)

	// Mock user login request
	user := models.User{
		UserName:       "testuser",
		InputPassword:  "testpass",
		HashedPassword: string(hashed),
	}
	payload, _ := json.Marshal(user)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestLoginUser_BadPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockRow := new(MockRow)

	mockRow.On("Scan", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)

	mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(mockRow)

	app := &App{
		DB: mockDB,
	}

	router := gin.New()
	router.POST("/", MakeUserHandler(app.LoginUser))

	user := models.User{
		UserName:       "testuser",
		InputPassword:  "wrongpass",                                                    // Wrong password
		HashedPassword: "$2a$10$7bKjklasd09u4Yh7p5hFfuzpsN..EWD0KCRJJJKfVq3LUV1Unv7me", // bcrypt-hash of "testpass"
	}
	payload, _ := json.Marshal(user)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestCreateUser_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockRow := new(MockRow)

	// 🛠 When checking for existing username, simulate "user not found" (sql.ErrNoRows)
	mockRow.On("Scan",
		mock.Anything,
		mock.Anything,
		mock.Anything,
		mock.Anything,
		mock.Anything,
	).Return(sql.ErrNoRows)

	mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(mockRow)

	// 🛠 Mock the actual insert (Exec) to succeed
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything).Return(pgconn.CommandTag{}, nil)

	app := &App{
		DB: mockDB,
	}

	router := gin.New()
	router.POST("/new-account/", MakeUserHandler(app.CreateUser))

	user := models.User{
		UserName:      "newuser",
		InputPassword: "newpass",
		FirstName:     "Test",
		LastName:      "User",
	}
	payload, _ := json.Marshal(user)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/new-account/", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 201, w.Code) // Created
}

func TestCreateUser_DuplicateUsername(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB := new(testutils.MockDB)
	mockRow := new(MockRow)

	// 🛠 Simulate that user already exists (no error on Scan)
	mockRow.On("Scan",
		mock.Anything,
		mock.Anything,
		mock.Anything,
		mock.Anything,
		mock.Anything,
	).Return(nil)

	mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything).Return(mockRow)

	app := &App{
		DB: mockDB,
	}

	router := gin.New()
	router.POST("/new-account/", MakeUserHandler(app.CreateUser))

	user := models.User{
		UserName:      "existinguser",
		InputPassword: "password",
	}
	payload, _ := json.Marshal(user)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/new-account/", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code) // Bad Request: duplicate username
}
