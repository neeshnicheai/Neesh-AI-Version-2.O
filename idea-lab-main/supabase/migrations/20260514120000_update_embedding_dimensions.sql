-- Migration: Update embedding dimensions for OpenAI text-embedding-3-small
-- From 768 dimensions (hash-based) to 1536 dimensions (OpenAI semantic embeddings)
-- Date: 2026-05-14

-- First, drop the existing RPC function that references VECTOR(768)
DROP FUNCTION IF EXISTS match_project_embeddings(VECTOR(768), FLOAT, INT, UUID);

-- Update the embedding column to use 1536 dimensions
-- Note: This will invalidate all existing embeddings, requiring re-ingestion
ALTER TABLE project_embeddings
ALTER COLUMN embedding TYPE VECTOR(1536);

-- Recreate the RPC function with updated vector dimensions
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

-- Mark all existing embeddings as inactive since they use the old hash-based approach
-- This ensures they'll be re-processed with real OpenAI embeddings
UPDATE project_embeddings
SET is_active = false
WHERE is_active = true;

-- Add a comment to track this migration
COMMENT ON COLUMN project_embeddings.embedding IS 'OpenAI text-embedding-3-small (1536 dimensions) - Updated 2026-05-14';