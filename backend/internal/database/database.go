package database

import (
	"database/sql"
	"time"

	_ "github.com/lib/pq"
	"github.com/rs/zerolog/log"
	"github.com/samusafe/genericapi/internal/config"
)

var DB *sql.DB

func Connect() error {
	if DB != nil {
		return nil
	}

	dsn := config.DatabaseURL
	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		return err
	}
	conn.SetMaxOpenConns(10)
	conn.SetMaxIdleConns(5)
	conn.SetConnMaxLifetime(30 * time.Minute)

	if err := conn.Ping(); err != nil {
		return err
	}

	DB = conn
	log.Info().Msg("database connected")
	return migrate()
}

func migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS collections (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT now(),
			UNIQUE(user_id, name)
		)`,
		`CREATE TABLE IF NOT EXISTS documents (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
			file_name TEXT NOT NULL,
			full_text TEXT,
			content_hash TEXT,
			created_at TIMESTAMPTZ DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS analyses (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			document_id INT REFERENCES documents(id) ON DELETE CASCADE,
			summary TEXT,
			keywords TEXT[],
			sentiment TEXT,
			created_at TIMESTAMPTZ DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS quiz_questions (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			analysis_id INT REFERENCES analyses(id) ON DELETE CASCADE,
			question TEXT NOT NULL,
			answer TEXT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT now()
		)`,
		// Ensure new columns exist (idempotent)
		`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS analysis_version SMALLINT DEFAULT 1 NOT NULL`,
		`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS batch_id UUID`,
		`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS batch_size INT`,
		`ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_hash TEXT`,
		// Backfill hashes
		`CREATE EXTENSION IF NOT EXISTS pgcrypto`,
		`UPDATE documents SET content_hash = encode(digest(full_text,'sha256'),'hex') WHERE content_hash IS NULL AND full_text IS NOT NULL`,
		`UPDATE documents SET content_hash = 'empty-' || id WHERE content_hash IS NULL`,
		// Deduplicate before unique indexes
		`WITH ranked AS (
			SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, collection_id, content_hash ORDER BY id) rn
			FROM documents
			WHERE content_hash IS NOT NULL
		) DELETE FROM documents d USING ranked r WHERE d.id = r.id AND r.rn > 1`,
		// Drop legacy composite index if existed
		`DROP INDEX IF EXISTS documents_user_collection_hash_unique`,
		// Unique indexes (partial) used by upsert logic
		`CREATE UNIQUE INDEX IF NOT EXISTS documents_user_null_collection_hash_uq ON documents(user_id, content_hash) WHERE collection_id IS NULL`,
		`CREATE UNIQUE INDEX IF NOT EXISTS documents_user_collection_hash_uq ON documents(user_id, collection_id, content_hash) WHERE collection_id IS NOT NULL`,
		// Performance indexes
		`CREATE INDEX IF NOT EXISTS analyses_document_id_created_at_idx ON analyses(document_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS analyses_user_created_at_idx ON analyses(user_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS documents_user_collection_idx ON documents(user_id, collection_id)`,
		`CREATE INDEX IF NOT EXISTS analyses_batch_id_idx ON analyses(batch_id)`,
	}
	for _, s := range stmts {
		if _, err := DB.Exec(s); err != nil {
			return err
		}
	}
	return nil
}
