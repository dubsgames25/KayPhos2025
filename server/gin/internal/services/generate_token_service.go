package services

/*
 * Generate JWT for logged in user
 */

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
)

// Secret key for signing JWTs Generate JWT token
func GenerateToken(user *models.User) (string, error) {
	JwtSecret := []byte(os.Getenv("JWT_SECRET"))
	claims := &models.Claims{
		UserID: user.UserID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(60 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtSecret)
}
