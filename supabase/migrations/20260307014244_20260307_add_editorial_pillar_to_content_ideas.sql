/*
  # Add editorial_pillar column to content_ideas table

  1. New Columns
    - `editorial_pillar` (text) - Editorial pillar/category for the idea
  
  2. Changes
    - Add missing editorial_pillar column to content_ideas table for consistency with content_calendar
    - This aligns the schema across both content creation tables
  
  3. Data Integrity
    - Column allows NULL values for existing records
    - Default to empty string for new records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'editorial_pillar'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN editorial_pillar text DEFAULT '';
  END IF;
END $$;