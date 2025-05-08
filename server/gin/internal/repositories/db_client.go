package repositories

import (
	"context"
	"github.com/kimsh02/kay-phos/server/gin/internal/models"
	"github.com/stretchr/testify/mock"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DBClient interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type FnddsRepo interface {
	FnddsQuery(db DBClient, ingredientName string) (*[]models.FnddsFoodItem, error)
}

type MockFnddsRepo struct {
	mock.Mock
}

func (m *MockFnddsRepo) FnddsQuery(db DBClient, ingredientName string) (*[]models.FnddsFoodItem, error) {
	args := m.Called(db, ingredientName)
	return args.Get(0).(*[]models.FnddsFoodItem), args.Error(1)
}
