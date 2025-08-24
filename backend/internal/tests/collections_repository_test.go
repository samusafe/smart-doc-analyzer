package tests

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/samusafe/genericapi/internal/repositories"
)

func openTestTx(t *testing.T) *sql.Tx {
	if testing.Short() {
		t.Skip("short mode")
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Skipf("open db: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		t.Skipf("ping db: %v", err)
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		t.Fatalf("begin tx: %v", err)
	}
	t.Cleanup(func() { _ = tx.Rollback() })
	return tx
}

func TestCollections_CreateDuplicate(t *testing.T) {
	tx := openTestTx(t)
	repo := repositories.NewCollectionsRepositoryWithExecutor(tx)
	user := "test-user-dup"
	name := fmt.Sprintf("Coll-%d", time.Now().UnixNano())
	c1, err := repo.Create(user, name)
	if err != nil {
		t.Fatalf("create 1 failed: %v", err)
	}
	if c1 == nil || c1.Name != name {
		t.Fatalf("unexpected c1: %+v", c1)
	}
	c2, err2 := repo.Create(user, name)
	if err2 == nil || err2.Error() != "exists" {
		t.Fatalf("expected exists error, got c2=%v err=%v", c2, err2)
	}
}
