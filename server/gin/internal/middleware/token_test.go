// token_test.go
//
// ✅ What This Tests
// - JWT generation from services.GenerateToken()
// - Validation logic inside ValidateTokenMiddleware()
// - Token accepted or rejected correctly via Gin routes
//
// 🧪 What’s Covered in This Pattern
// ✅ Token creation with valid claims
// ✅ Middleware passes with good token
// ✅ Middleware blocks missing or invalid token
// ✅ Expired token behavior (could add later)
//
// 🧪 What’s NOT Covered
// ❌ Full login/signup flow (separate test)
// ❌ Cookie logic outside Gin (handled internally)

package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/kimsh02/kay-phos/server/gin/internal/services"
	"github.com/stretchr/testify/assert"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func TestGenerateToken(t *testing.T) {
	err := os.Setenv("JWT_SECRET", "testsecret")
	if err != nil {
		return
	}

	mockUser := &models.User{
		UserID: uuid.New(),
	}
	token, err := services.GenerateToken(mockUser)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestValidateTokenMiddleware_Success(t *testing.T) {
	err := os.Setenv("JWT_SECRET", "testsecret")
	if err != nil {
		return
	}

	// Create token
	mockUser := &models.User{UserID: uuid.New()}
	token, _ := services.GenerateToken(mockUser)

	// Setup Gin
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(ValidateTokenMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: token})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestValidateTokenMiddleware_MissingToken(t *testing.T) {
	err := os.Setenv("JWT_SECRET", "testsecret")
	if err != nil {
		return
	}

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(ValidateTokenMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest("GET", "/test", nil) // ❌ No token
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestValidateTokenMiddleware_InvalidToken(t *testing.T) {
	err := os.Setenv("JWT_SECRET", "testsecret")
	if err != nil {
		return
	}

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(ValidateTokenMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: "invalid.jwt.token"})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestValidateTokenMiddleware_ExpiredToken(t *testing.T) {
	err := os.Setenv("JWT_SECRET", "testsecret")
	if err != nil {
		return
	}

	expiredClaims := models.Claims{
		UserID: uuid.New().String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // ⏰ already expired
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	// Setup Gin
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(ValidateTokenMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: tokenString})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
