-- Ensure tables exist (previous steps management)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add subscription_expires_at column for 30-day Pro timer
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    one_line_summary TEXT,
    introduction TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    document_group_id UUID NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE EXTENSION IF NOT EXISTS vector;

-- Project Embeddings / Vectors
CREATE TABLE IF NOT EXISTS project_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    document_group_id UUID NOT NULL,
    document_version INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions 
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    source_type TEXT NOT NULL DEFAULT 'DOCUMENT' CHECK (source_type IN ('DOCUMENT', 'MANUAL')),
    manual_answer_type TEXT CHECK (manual_answer_type IN ('OVERRIDE', 'SUPPLEMENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embeddings_project_id ON project_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_doc_group ON project_embeddings(document_group_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_active ON project_embeddings(is_active);

-- Learning Loop Tables

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    question_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    ask_count INTEGER NOT NULL DEFAULT 1,
    notification_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (notification_status IN ('OPEN', 'RESOLVED', 'REOPENED')),
    first_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_project_normalized ON questions(project_id, normalized_text);

CREATE TABLE IF NOT EXISTS manual_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_text TEXT NOT NULL,
    answer_type TEXT NOT NULL DEFAULT 'SUPPLEMENT' CHECK (answer_type IN ('OVERRIDE', 'SUPPLEMENT')),
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_text TEXT NOT NULL,
    confidence_level TEXT NOT NULL,
    is_ai_answer BOOLEAN NOT NULL DEFAULT TRUE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_log_id UUID NOT NULL REFERENCES answer_logs(id),
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('POSITIVE', 'NEGATIVE')),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION match_project_embeddings (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_project_id UUID
)
RETURNS TABLE (
  chunk_text TEXT,
  document_group_id UUID,
  document_version INT,
  chunk_index INT,
  similarity FLOAT,
  source_type TEXT,
  manual_answer_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    project_embeddings.chunk_text,
    project_embeddings.document_group_id,
    project_embeddings.document_version,
    project_embeddings.chunk_index,
    1 - (project_embeddings.embedding <=> query_embedding) AS similarity,
    project_embeddings.source_type,
    project_embeddings.manual_answer_type
  FROM project_embeddings
  WHERE 1 - (project_embeddings.embedding <=> query_embedding) > match_threshold
  AND project_embeddings.project_id = filter_project_id
  AND project_embeddings.is_active = TRUE
  ORDER BY project_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
