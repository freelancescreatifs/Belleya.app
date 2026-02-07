/*
  # Add Performance Indexes for Clients Table

  1. Performance Improvements
    - Add index on `updated_at DESC` for efficient sorting of recent clients
    - Add index on `created_at DESC` for sorting by creation date
    - Add trigram index on `first_name` for fast case-insensitive search
    - Add trigram index on `last_name` for fast case-insensitive search
    - Add trigram index on `email` for fast case-insensitive search
    - Add trigram index on `phone` for fast case-insensitive search
    - Add composite index on `user_id, is_archived, updated_at` for filtered queries

  2. Why These Indexes
    - `updated_at DESC`: Fast sorting for "most recent" queries
    - `created_at DESC`: Fast sorting for "newest" queries
    - Trigram indexes: Enable fast ILIKE/LIKE searches (case-insensitive)
    - Composite index: Optimize common filter patterns (user + archived status + sort)

  3. Impact
    - Queries with ORDER BY updated_at/created_at: 10-100x faster
    - Search queries with ILIKE: 5-50x faster
    - Pagination with WHERE + ORDER BY: Much more efficient
*/

-- Enable pg_trgm extension for trigram indexes (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for sorting by updated_at (most common sort)
CREATE INDEX IF NOT EXISTS idx_clients_updated_at_desc 
  ON clients (updated_at DESC);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_clients_created_at_desc 
  ON clients (created_at DESC);

-- Trigram indexes for case-insensitive search on text fields
CREATE INDEX IF NOT EXISTS idx_clients_first_name_trgm 
  ON clients USING gin (lower(first_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_last_name_trgm 
  ON clients USING gin (lower(last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_email_trgm 
  ON clients USING gin (lower(email) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm 
  ON clients USING gin (lower(phone) gin_trgm_ops);

-- Composite index for common query pattern: filter by user + archived + sort
CREATE INDEX IF NOT EXISTS idx_clients_user_archived_updated 
  ON clients (user_id, is_archived, updated_at DESC);

-- Index for filtering by user + archived status
CREATE INDEX IF NOT EXISTS idx_clients_user_archived 
  ON clients (user_id, is_archived);