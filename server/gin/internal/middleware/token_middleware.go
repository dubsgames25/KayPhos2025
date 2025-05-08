package middleware

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"net/http"
	"os"
)

func ValidateTokenMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("token")
		if err != nil {
			handleUnauthorized(c, "Missing token")
			return
		}

		claims := &models.Claims{}
		parsedToken, err := parseToken(tokenString, claims)
		if err != nil || !parsedToken.Valid {
			handleUnauthorized(c, "Your session is invalid or has expired. Please login again.")
			return
		}

		// ✅ Passed all checks
		c.Set("claims", claims)
		c.Next()
	}
}

// --- Helper to parse the token ---
func parseToken(tokenString string, claims *models.Claims) (*jwt.Token, error) {
	return jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		secret := os.Getenv("JWT_SECRET")
		return []byte(secret), nil
	})
}

// --- Helper to handle unauthorized responses ---
func handleUnauthorized(c *gin.Context, message string) {
	c.Abort()
	if gin.Mode() == gin.TestMode {
		c.JSON(http.StatusUnauthorized, gin.H{"error": message})
		return
	}
	c.HTML(http.StatusUnauthorized, "unauthorized.html", gin.H{
		"title":   "Access Denied",
		"message": message,
	})
}
