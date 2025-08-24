package repositories

import (
	"database/sql"
	"errors"
	"strings"

	"github.com/samusafe/genericapi/internal/database"
	"github.com/samusafe/genericapi/internal/models"
)

// SQLExecutor abstracts *sql.DB and *sql.Tx (methods needed).
type SQLExecutor interface {
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
	Exec(query string, args ...any) (sql.Result, error)
}

type CollectionsRepository interface {
	List(userID string) ([]models.Collection, error)
	Create(userID, name string) (*models.Collection, error)
	Delete(userID string, id int) error
	ExistsForUser(userID string, id int) (bool, error)
}

type collectionsRepository struct {
	exec SQLExecutor
}

func NewCollectionsRepository() CollectionsRepository {
	return &collectionsRepository{exec: database.DB}
}

// NewCollectionsRepositoryWithExecutor allows injecting a custom SQL executor (e.g., *sql.Tx) for tests.
func NewCollectionsRepositoryWithExecutor(exec SQLExecutor) CollectionsRepository {
	return &collectionsRepository{exec: exec}
}

func (r *collectionsRepository) List(userID string) ([]models.Collection, error) {
	rows, err := r.exec.Query(`SELECT c.id, c.user_id, c.name, c.created_at, COALESCE(count(d.id),0) as documents
		FROM collections c
		LEFT JOIN documents d ON d.collection_id = c.id AND d.user_id = c.user_id
		WHERE c.user_id = $1
		GROUP BY c.id
		ORDER BY c.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Collection
	for rows.Next() {
		var c models.Collection
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.CreatedAt, &c.Documents); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, nil
}

func (r *collectionsRepository) Create(userID, name string) (*models.Collection, error) {
	clean := strings.TrimSpace(name)
	if clean == "" {
		return nil, errors.New("invalid")
	}
	var id int
	err := r.exec.QueryRow(`INSERT INTO collections(user_id, name) VALUES($1,$2) RETURNING id`, userID, clean).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("exists")
		}
		return nil, err
	}
	return &models.Collection{ID: id, UserID: userID, Name: clean, Documents: 0}, nil
}

func (r *collectionsRepository) Delete(userID string, id int) error {
	res, err := r.exec.Exec(`DELETE FROM collections WHERE id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		return err
	}
	rc, _ := res.RowsAffected()
	if rc == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *collectionsRepository) ExistsForUser(userID string, id int) (bool, error) {
	var exists bool
	err := r.exec.QueryRow(`SELECT EXISTS(SELECT 1 FROM collections WHERE id=$1 AND user_id=$2)`, id, userID).Scan(&exists)
	return exists, err
}
