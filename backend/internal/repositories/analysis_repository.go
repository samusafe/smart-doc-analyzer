package repositories

import (
	"database/sql"
	"errors"
	"log"
	"strings"

	"github.com/lib/pq"
	"github.com/samusafe/genericapi/internal/database"
	"github.com/samusafe/genericapi/internal/models"
)

type AnalysisRepository interface {
	InsertDocument(userID string, collectionID *int, fileName, fullText string, contentHash string) (int, error)
	InsertAnalysis(userID string, documentID int, summary string, keywords []string, sentiment string, batchID *string, batchSize *int) (int, error)
	FindDocument(userID string, collectionID *int, contentHash string) (int, error)
	GetLatestAnalysisByDocument(userID string, documentID int) (*models.AnalysisDetail, error)
	ListDocumentsByCollection(userID string, collectionID *int) ([]models.DocumentItem, error)
	ListAllDocuments(userID string) ([]models.DocumentItem, error)
	UpdateDocumentCollection(userID string, documentID int, collectionID int) error
}

type analysisRepository struct{ db *sql.DB }

func NewAnalysisRepository() AnalysisRepository { return &analysisRepository{db: database.DB} }

func (r *analysisRepository) InsertDocument(userID string, collectionID *int, fileName, fullText string, contentHash string) (int, error) {
	var id int
	if collectionID != nil {
		err := r.db.QueryRow(`INSERT INTO documents(user_id, collection_id, file_name, full_text, content_hash) VALUES($1,$2,$3,$4,$5) RETURNING id`, userID, *collectionID, fileName, fullText, contentHash).Scan(&id)
		return id, err
	}
	err := r.db.QueryRow(`INSERT INTO documents(user_id, file_name, full_text, content_hash) VALUES($1,$2,$3,$4) RETURNING id`, userID, fileName, fullText, contentHash).Scan(&id)
	return id, err
}

func (r *analysisRepository) InsertAnalysis(userID string, documentID int, summary string, keywords []string, sentiment string, batchID *string, batchSize *int) (int, error) {
	var id int
	clean := make([]string, 0, len(keywords))
	for _, k := range keywords {
		k = strings.TrimSpace(strings.ReplaceAll(k, ",", " "))
		if k != "" {
			clean = append(clean, k)
		}
	}
	if err := r.db.QueryRow(`INSERT INTO analyses(user_id, document_id, summary, keywords, sentiment, analysis_version, batch_id, batch_size) VALUES($1,$2,$3,$4,$5,1,$6,$7) RETURNING id`, userID, documentID, summary, pq.Array(clean), sentiment, batchID, batchSize).Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}

func (r *analysisRepository) FindDocument(userID string, collectionID *int, contentHash string) (int, error) {
	qWithCol := `SELECT id FROM documents WHERE user_id=$1 AND collection_id=$2 AND content_hash=$3 LIMIT 1`
	qNoCol := `SELECT id FROM documents WHERE user_id=$1 AND collection_id IS NULL AND content_hash=$2 LIMIT 1`
	var id int
	var err error
	if collectionID != nil {
		err = r.db.QueryRow(qWithCol, userID, *collectionID, contentHash).Scan(&id)
	} else {
		err = r.db.QueryRow(qNoCol, userID, contentHash).Scan(&id)
	}
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *analysisRepository) GetLatestAnalysisByDocument(userID string, documentID int) (*models.AnalysisDetail, error) {
	q := `SELECT a.id, d.id, d.file_name, a.summary, a.sentiment, COALESCE(a.keywords, '{}'::text[]), d.collection_id, a.created_at, COALESCE(d.full_text,'') as full_text, a.analysis_version, a.batch_id, a.batch_size
		FROM analyses a
		JOIN documents d ON a.document_id = d.id AND a.user_id = d.user_id
		WHERE a.user_id = $1 AND d.id = $2
		ORDER BY a.created_at DESC LIMIT 1`
	var detail models.AnalysisDetail
	var colID sql.NullInt64
	var keywords []string
	if err := r.db.QueryRow(q, userID, documentID).Scan(&detail.AnalysisID, &detail.DocumentID, &detail.FileName, &detail.Summary, &detail.Sentiment, pq.Array(&keywords), &colID, &detail.CreatedAt, &detail.FullText, &detail.AnalysisVersion, &detail.BatchID, &detail.BatchSize); err != nil {
		log.Printf("GetLatestAnalysisByDocument error user=%s doc=%d: %v", userID, documentID, err)
		return nil, err
	}
	detail.Keywords = keywords
	if colID.Valid {
		v := int(colID.Int64)
		detail.CollectionID = &v
	}
	return &detail, nil
}

func (r *analysisRepository) ListDocumentsByCollection(userID string, collectionID *int) ([]models.DocumentItem, error) {
	qBase := `SELECT d.id, d.file_name, COALESCE(COUNT(a.id),0) as analyses_count, COALESCE(MAX(a.created_at)::text,'') as last_at, d.collection_id
		FROM documents d
		LEFT JOIN analyses a ON a.document_id = d.id AND a.user_id = d.user_id
		WHERE d.user_id = $1`
	var rows *sql.Rows
	var err error
	if collectionID != nil {
		rows, err = r.db.Query(qBase+` AND d.collection_id = $2 GROUP BY d.id ORDER BY last_at DESC NULLS LAST, d.id DESC`, userID, *collectionID)
	} else {
		rows, err = r.db.Query(qBase+` AND d.collection_id IS NULL GROUP BY d.id ORDER BY last_at DESC NULLS LAST, d.id DESC`, userID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.DocumentItem
	for rows.Next() {
		var it models.DocumentItem
		var lastAt string
		var colID sql.NullInt64
		if err := rows.Scan(&it.ID, &it.FileName, &it.AnalysesCount, &lastAt, &colID); err != nil {
			return nil, err
		}
		it.LastAnalysisAt = lastAt
		if colID.Valid {
			v := int(colID.Int64)
			it.CollectionID = &v
		}
		out = append(out, it)
	}
	return out, nil
}

func (r *analysisRepository) ListAllDocuments(userID string) ([]models.DocumentItem, error) {
	rows, err := r.db.Query(`SELECT d.id, d.file_name, COALESCE(COUNT(a.id),0) as analyses_count, COALESCE(MAX(a.created_at)::text,'') as last_at, d.collection_id
		FROM documents d
		LEFT JOIN analyses a ON a.document_id = d.id AND a.user_id = d.user_id
		WHERE d.user_id=$1
		GROUP BY d.id
		ORDER BY last_at DESC NULLS LAST, d.id DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.DocumentItem
	for rows.Next() {
		var it models.DocumentItem
		var lastAt string
		var colID sql.NullInt64
		if err := rows.Scan(&it.ID, &it.FileName, &it.AnalysesCount, &lastAt, &colID); err != nil {
			return nil, err
		}
		it.LastAnalysisAt = lastAt
		if colID.Valid {
			v := int(colID.Int64)
			it.CollectionID = &v
		}
		out = append(out, it)
	}
	return out, nil
}

func (r *analysisRepository) UpdateDocumentCollection(userID string, documentID int, collectionID int) error {
	res, err := r.db.Exec(`UPDATE documents SET collection_id=$1 WHERE id=$2 AND user_id=$3 AND collection_id IS NULL`, collectionID, documentID, userID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err == nil && affected == 0 {
		return errors.New("already_assigned")
	}
	return err
}
