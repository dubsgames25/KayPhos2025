package models

/*
 * json struct to model jwt tokens
 */

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	UserID string `json:"userid"`
	jwt.RegisteredClaims
}
