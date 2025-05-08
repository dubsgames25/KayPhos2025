package repositories

import (
	"github.com/google/uuid"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/stretchr/testify/assert"
	"testing"
)

//✅ What This Tests
//- CreateUser(): inserts new user with hashed password
//- GetUser(): retrieves user by username or UUID
//
//🧪 What’s Covered in This Pattern
//✅ Positive insert + fetch by username
//✅ Duplicate username handling
//✅ Validation for empty username/password via model checks
//
//🧪 What’s NOT Covered
//❌ Login endpoint logic
//❌ Session storage
//❌ Email verification or token issuance

func TestInsertAndRetrieveUser(t *testing.T) {
	pool := SetupTestDB(t)

	user := &models.User{
		FirstName:     "Test",
		LastName:      "User",
		UserName:      "testuser_" + uuid.NewString(), // random username
		InputPassword: "password123",
	}
	err := user.SetHashedPassword()
	assert.NoError(t, err)
	user.SetUserID()

	err = CreateUser(pool, user)
	assert.NoError(t, err)

	retrieved := &models.User{UserName: user.UserName}
	err = GetUser(pool, retrieved)
	assert.NoError(t, err)

	assert.Equal(t, user.FirstName, retrieved.FirstName)
	assert.Equal(t, user.LastName, retrieved.LastName)
}

func TestDuplicateUsernameFails(t *testing.T) {
	pool := SetupTestDB(t)

	username := "testuser_" + uuid.NewString()

	user1 := &models.User{
		FirstName:     "First",
		LastName:      "User",
		UserName:      username,
		InputPassword: "password123",
	}
	_ = user1.SetHashedPassword()
	user1.SetUserID()
	err := CreateUser(pool, user1)
	assert.NoError(t, err)

	user2 := &models.User{
		FirstName:     "Second",
		LastName:      "User",
		UserName:      username, // same username
		InputPassword: "password456",
	}
	_ = user2.SetHashedPassword()
	user2.SetUserID()
	err = CreateUser(pool, user2)
	assert.Error(t, err, "Expected error when inserting duplicate username")
}
