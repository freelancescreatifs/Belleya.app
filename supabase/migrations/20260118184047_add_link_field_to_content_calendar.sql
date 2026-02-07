/*
  # Add link field to content_calendar table

  1. Changes
    - Add `link` column to `content_calendar` table to store external links (Canva, Drive, etc.)
    
  2. Details
    - Type: text (nullable)
    - Used for storing reference links to design tools, documents, briefs, etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'link'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN link text;
  END IF;
END $$;