package repositories

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupTestDB(t *testing.T) *pgxpool.Pool {
	t.Helper()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Fatal("DATABASE_URL must be set for tests")
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		t.Fatalf("Failed to parse test db URL: %v", err)
	}

	PrepareSQLStatements(config)

	dbpool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Optionally clean tables before each test run
	_, _ = dbpool.Exec(context.Background(), `TRUNCATE TABLE meals, users, fndds_nutrient_values RESTART IDENTITY CASCADE;`)

	return dbpool
}
