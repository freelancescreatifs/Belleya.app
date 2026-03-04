/*
  # Add extra fields to affiliate_applications

  1. Modified Tables
    - `affiliate_applications`
      - `first_name` (text) - applicant first name
      - `last_name` (text) - applicant last name
      - `phone` (text, optional) - phone number
      - `tiktok_url` (text, optional) - TikTok profile
      - `linkedin_url` (text, optional) - LinkedIn profile
      - `audience` (text, optional) - audience size description

  2. Notes
    - Existing `full_name` column preserved for backward compatibility
    - Existing `experience_level` kept but made nullable for new flow
    - New columns are all optional to not break existing rows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'phone'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'tiktok_url'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN tiktok_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN linkedin_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'audience'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN audience text;
  END IF;
END $$;

ALTER TABLE affiliate_applications ALTER COLUMN experience_level DROP NOT NULL;
ALTER TABLE affiliate_applications ALTER COLUMN full_name DROP NOT NULL;