/*
  # Add Instagram Statistics to Company Profiles

  1. Changes
    - Add `instagram_followers_count` column to track follower count (manually entered)
    - Add `instagram_following_count` column to track following count (manually entered)
  
  2. Notes
    - Both fields are optional and default to 0
    - These are manually maintained statistics for Instagram profile display
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_followers_count'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_followers_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_following_count'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_following_count integer DEFAULT 0;
  END IF;
END $$;