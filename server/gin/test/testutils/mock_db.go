package testutils

import (
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/mock"
	"golang.org/x/net/context"
)

// test/mockDb/mock_db.go
type MockDB struct {
	mock.Mock
}

func (m *MockDB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	called := m.Called(ctx, sql, args)
	return called.Get(0).(pgx.Row)
}

func (m *MockDB) Query(ctx context.Context, query string, args ...any) (pgx.Rows, error) {
	called := m.Called(ctx, query, args)
	return called.Get(0).(pgx.Rows), called.Error(1)
}

func (m *MockDB) Exec(ctx context.Context, query string, args ...any) (pgconn.CommandTag, error) {
	called := m.Called(ctx, query, args)
	return called.Get(0).(pgconn.CommandTag), called.Error(1)
}

type MockRows struct{}

func (m *MockRows) Close()                                       {}
func (m *MockRows) Err() error                                   { return nil }
func (m *MockRows) CommandTag() pgconn.CommandTag                { return pgconn.CommandTag{} }
func (m *MockRows) FieldDescriptions() []pgconn.FieldDescription { return nil }
func (m *MockRows) Next() bool                                   { return false }
func (m *MockRows) Scan(dest ...any) error                       { return nil }
func (m *MockRows) Values() ([]any, error)                       { return nil, nil }
func (m *MockRows) RawValues() [][]byte                          { return nil }
func (m *MockRows) Conn() *pgx.Conn                              { return nil }
func (m *MockRows) RawValuesBytes() [][]byte                     { return nil }
