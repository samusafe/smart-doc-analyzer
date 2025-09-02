-- This script initializes the database schema for the application.

-- Enable pgcrypto for hashing functions if it's not already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table to store user-defined collections for organizing documents.
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Table to store uploaded documents.
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    full_text TEXT,
    content_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table to store the results of document analyses.
-- A single document can have multiple analyses over time.
CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    summary TEXT,
    keywords TEXT[],
    sentiment TEXT,
    summary_points TEXT[],
    analysis_version SMALLINT DEFAULT 1 NOT NULL,
    batch_id UUID,
    batch_size INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table to store questions and answers for quizzes generated from analyses.
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    analysis_id INT REFERENCES analyses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --- INDEXES ---

-- Performance indexes for common query patterns.
CREATE INDEX IF NOT EXISTS analyses_document_id_created_at_idx ON analyses(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_user_created_at_idx ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_user_collection_idx ON documents(user_id, collection_id);
CREATE INDEX IF NOT EXISTS analyses_batch_id_idx ON analyses(batch_id);

-- Unique indexes to prevent duplicate documents based on content hash.
-- These are partial indexes, one for documents in a collection and one for documents without a collection.
CREATE UNIQUE INDEX IF NOT EXISTS documents_user_null_collection_hash_uq ON documents(user_id, content_hash) WHERE collection_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_user_collection_hash_uq ON documents(user_id, collection_id, content_hash) WHERE collection_id IS NOT NULL;
