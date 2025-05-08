package handlers

import (
	"github.com/kimsh02/kay-phos/server/gin/internal/repositories"
)

/*
 * dependency injection for handlers using dbpool
 */

type App struct {
	DB        repositories.DBClient
	FnddsRepo repositories.FnddsRepo
}
