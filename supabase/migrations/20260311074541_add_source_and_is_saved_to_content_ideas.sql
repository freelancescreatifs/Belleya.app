/*
  # Add source and is_saved columns to content_ideas

  1. Modified Tables
    - `content_ideas`
      - `source` (text) - Tracks origin of the idea: 'manual' or 'ai'. Defaults to 'manual'.
      - `is_saved` (boolean) - Whether the idea has been starred/saved by the user. Defaults to false.

  2. Important Notes
    - These columns are required by the frontend filtering logic to separate manual ideas, AI-generated ideas, and starred ideas into different tabs.
    - Existing rows will get default values ('manual' for source, false for is_saved).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'source'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN source text DEFAULT 'manual';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'is_saved'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN is_saved boolean DEFAULT false;
  END IF;
END $$;
