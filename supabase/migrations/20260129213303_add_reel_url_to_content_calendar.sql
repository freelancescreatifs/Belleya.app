/*
  # Add Reel URL to Content Calendar

  1. Changes
    - Add `reel_url` column to `content_calendar` table to store Instagram/TikTok reel URLs
    - This allows users to reference existing content for inspiration

  2. Purpose
    - Enable linking to external reel content for inspiration and reference
    - Support content curation workflow
*/

-- Add reel_url column to content_calendar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'reel_url'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN reel_url text;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN content_calendar.reel_url IS 'URL to Instagram/TikTok reel for inspiration or reference';