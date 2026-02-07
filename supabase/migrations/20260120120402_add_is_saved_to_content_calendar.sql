/*
  # Add is_saved column to content_calendar

  1. Changes
    - Add `is_saved` boolean column to `content_calendar` table
    - Default value is false
    - This column is used to mark ideas as "saved/starred" for the Ideas Generator feature

  2. Purpose
    - Allow users to mark their favorite ideas for quick access
    - Separate saved ideas from regular manual/AI-generated ideas
*/

-- Add is_saved column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'is_saved'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN is_saved boolean DEFAULT false;
  END IF;
END $$;
