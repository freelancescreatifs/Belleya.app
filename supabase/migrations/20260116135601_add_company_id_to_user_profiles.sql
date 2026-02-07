/*
  # Add company_id to user_profiles
  
  ## Description
  This migration fixes the issue where user_profiles don't have a company_id field,
  causing modules like Training to fail when checking company_id for multi-tenant access.
  
  ## Changes
  1. Add company_id column to user_profiles table
  2. Create a function to automatically sync company_id when company_profiles is created/updated
  3. Create triggers to keep user_profiles.company_id in sync with company_profiles
  4. Backfill existing user_profiles with company_id from company_profiles
  
  ## Safety
  - Nullable company_id initially to support gradual rollout
  - Automatic sync via triggers ensures data consistency
  - Backfill script for existing data
*/

-- Add company_id column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN company_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- Function to sync company_id to user_profiles when company_profiles is created/updated
CREATE OR REPLACE FUNCTION sync_company_id_to_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET company_id = NEW.id
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on company_profiles to sync company_id
DROP TRIGGER IF EXISTS trigger_sync_company_id ON company_profiles;
CREATE TRIGGER trigger_sync_company_id
  AFTER INSERT OR UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_id_to_user_profile();

-- Backfill existing user_profiles with company_id from company_profiles
UPDATE user_profiles up
SET company_id = cp.id
FROM company_profiles cp
WHERE up.user_id = cp.user_id
  AND up.company_id IS NULL;