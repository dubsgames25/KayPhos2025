package repositories

import (
	"context"
	"database/sql"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
)

/*
 * User repository interacts with users table in postgres
 */

// checks if username exists in users table
// func CheckUserNameExists(dbPool *pgxpool.Pool, username *string) bool {
// 	var exists bool
// 	row := dbPool.QueryRow(context.Background(), "unique_username_query", username)
// 	if err := row.Scan(&exists); err != nil {
// 		log.Println("Error scanning username.")
// 		log.Println(err)
// 	}
// 	return exists
// }

// Get user
func GetUser(dbPool DBClient, user *models.User) error {
	// Get user by appropriate value
	var byValue interface{}
	var query string
	if user.UserID == uuid.Nil {
		byValue = user.UserName
		query = "user_select_username_query"
	} else {
		byValue = user.UserID
		query = "user_select_userid_query"
	}
	row := dbPool.QueryRow(context.Background(), query, byValue)
	if err := row.Scan(&user.FirstName, &user.LastName, &user.UserName, &user.UserID, &user.HashedPassword); err != nil {
		if err != sql.ErrNoRows {
			return errors.New("Invalid username.")
		} else {
			return err
		}
	}
	return nil
}

// create user in users table
func CreateUser(dbPool DBClient, user *models.User) error {
	// Insert user into db
	_, err := dbPool.Exec(context.Background(), "user_insert_query", user.FirstName, user.LastName, user.UserName, user.UserID, user.HashedPassword)
	if err != nil {
		log.Println("Error inserting user into database.")
		log.Println(err)
		return err
	}
	return nil
}
