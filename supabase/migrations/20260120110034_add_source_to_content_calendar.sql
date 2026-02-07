/*
  # Add source field to content_calendar

  1. Changes
    - Add `source` column to `content_calendar` table
      - Values: 'manual', 'ai'
      - Default: 'manual'
    - Add `publication_time` column for scheduling
      - Default: '12:00'

  2. Purpose
    - Distinguish between manually created ideas and AI-generated ideas
    - Allow proper filtering in the Ideas Box interface
*/

-- Add source column to distinguish manual vs AI ideas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'source'
  ) THEN
    ALTER TABLE content_calendar 
    ADD COLUMN source text DEFAULT 'manual' CHECK (source IN ('manual', 'ai'));
  END IF;
END $$;

-- Add publication_time if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'publication_time'
  ) THEN
    ALTER TABLE content_calendar 
    ADD COLUMN publication_time text DEFAULT '12:00';
  END IF;
END $$;