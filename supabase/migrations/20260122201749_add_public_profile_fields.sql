/*
  # Add public profile fields to company_profiles

  1. Modifications
    - Add public profile fields:
      - `profile_photo` (text): URL of profile photo
      - `bio` (text): Biography for public profile
      - `instagram_url` (text): Full Instagram URL
      - `address` (text): Full postal address
      - `institute_photos` (jsonb): Array of institute photos
      - `diplomas` (jsonb): Array of diplomas
      - `conditions` (jsonb): Array of booking conditions
      - `special_offer` (text): Current special offer

  2. Notes
    - These fields are used for the public profile visible to clients
    - institute_photos, diplomas, conditions are stored as JSONB arrays
    - latitude/longitude already exist for geocoding
*/

DO $$
BEGIN
  -- Add profile_photo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN profile_photo text;
  END IF;

  -- Add bio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN bio text;
  END IF;

  -- Add instagram_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_url text;
  END IF;

  -- Add address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN address text;
  END IF;

  -- Add institute_photos (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'institute_photos'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN institute_photos jsonb DEFAULT '[]';
  END IF;

  -- Add diplomas (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'diplomas'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN diplomas jsonb DEFAULT '[]';
  END IF;

  -- Add conditions (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'conditions'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN conditions jsonb DEFAULT '[]';
  END IF;

  -- Add special_offer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'special_offer'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN special_offer text;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN company_profiles.profile_photo IS 'URL of the profile photo visible to clients';
COMMENT ON COLUMN company_profiles.bio IS 'Biography visible on public profile';
COMMENT ON COLUMN company_profiles.instagram_url IS 'Full Instagram profile URL';
COMMENT ON COLUMN company_profiles.address IS 'Full postal address for geocoding and display';
COMMENT ON COLUMN company_profiles.institute_photos IS 'Array of institute photos [{id, url, order}]';
COMMENT ON COLUMN company_profiles.diplomas IS 'Array of diplomas [{id, name, year}]';
COMMENT ON COLUMN company_profiles.conditions IS 'Array of booking conditions [{id, text}]';
COMMENT ON COLUMN company_profiles.special_offer IS 'Current special offer text';
