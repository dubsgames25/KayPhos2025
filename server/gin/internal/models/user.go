package models

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

/*
 * User is the model for users of kayphos, a User can be created, updated,
 * deleted, or retreived from the database
 */

type User struct {
	FirstName      string    `json:"firstname"`
	LastName       string    `json:"lastname"`
	UserName       string    `json:"username"`
	UserID         uuid.UUID `json:"userid"`
	HashedPassword string    `json:"hashedpassword"`
	InputPassword  string    `json:"inputpassword"`
}

// SetUserID Set user id for a newly created User
func (user *User) SetUserID() {
	user.UserID = uuid.New()
}

// VerifyPassword Verifies input password against hashed password
func (user *User) VerifyPassword() bool {
	return bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(user.InputPassword)) == nil
}

// SetHashedPassword Sets hashed password for a newly created User given a password
func (user *User) SetHashedPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.InputPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Println(err)
		return err
	}
	user.HashedPassword = string(hashedPassword)
	return nil
}

// CheckPassword Checks hashed password to the given password
func (user *User) CheckPassword(password string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(password)); err != nil {
		log.Println(err)
		return err
	}
	return nil
}

// CheckPasswordAndUsername Check for empty password or username
func (user *User) CheckPasswordAndUsername() error {
	// Basic check if username is empty string
	if user.UserName == "" {
		return errors.New("no username given")
	}
	// Basic check if password is empty string
	if user.InputPassword == "" {
		return errors.New("no password given")
	}
	return nil
}
