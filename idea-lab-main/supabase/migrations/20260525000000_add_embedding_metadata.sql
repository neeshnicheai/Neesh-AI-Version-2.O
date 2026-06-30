-- Migration: Add metadata JSONB column to project_embeddings
-- This enables metadata enrichment: storing filename, MIME type, version,
-- chunk size, and ingest timestamp alongside each chunk vector.
-- Date: 2026-05-25

-- Add metadata column (nullable so existing rows are unaffected)
ALTER TABLE project_embeddings
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Create GIN index for efficient metadata querying
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata
ON project_embeddings USING GIN (metadata);

-- Update the match_project_embeddings RPC to return metadata
DROP FUNCTION IF EXISTS match_project_embeddings(VECTOR(1536), FLOAT, INT, UUID);

CREATE OR REPLACE FUNCTION match_project_embeddings (
  query_embedding    VECTOR(1536),
  match_threshold    FLOAT,
  match_count        INT,
  filter_project_id  UUID
)
RETURNS TABLE (
  chunk_text          TEXT,
  document_group_id   UUID,
  document_version    INT,
  chunk_index         INT,
  similarity          FLOAT,
  source_type         TEXT,
  manual_answer_type  TEXT,
  metadata            JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.chunk_text,
    pe.document_group_id,
    pe.document_version,
    pe.chunk_index,
    1 - (pe.embedding <=> query_embedding) AS similarity,
    pe.source_type,
    pe.manual_answer_type,
    pe.metadata
  FROM project_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
    AND pe.project_id = filter_project_id
    AND pe.is_active  = TRUE
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON COLUMN project_embeddings.metadata IS
  'JSONB chunk metadata: filename, mimeType, version, chunkSize, chunkOverlap, ingestedAt';
