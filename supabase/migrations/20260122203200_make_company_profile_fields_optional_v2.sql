/*
  # Make company profile fields optional for public profile

  1. Modifications
    - Make activity_type, creation_date, and legal_status nullable
    - These are fiscal fields not required for public profile configuration
    - Allows users to configure public profile without completing fiscal setup

  2. Notes
    - company_name remains NOT NULL as it's essential
    - country keeps its default value but becomes nullable
    - Existing records with invalid values are cleaned up first
*/

-- Drop existing constraint first
ALTER TABLE company_profiles 
  DROP CONSTRAINT IF EXISTS company_profiles_legal_status_check;

-- Make activity_type nullable
ALTER TABLE company_profiles 
  ALTER COLUMN activity_type DROP NOT NULL;

-- Make creation_date nullable
ALTER TABLE company_profiles 
  ALTER COLUMN creation_date DROP NOT NULL;

-- Make legal_status nullable
ALTER TABLE company_profiles 
  ALTER COLUMN legal_status DROP NOT NULL;

-- Make country nullable (keeps default)
ALTER TABLE company_profiles 
  ALTER COLUMN country DROP NOT NULL;

-- Update any existing NULL or invalid legal_status values to NULL explicitly
UPDATE company_profiles 
SET legal_status = NULL 
WHERE legal_status IS NULL 
   OR legal_status NOT IN ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl', 'autre');

-- Re-add constraint allowing NULL
ALTER TABLE company_profiles 
  ADD CONSTRAINT company_profiles_legal_status_check 
  CHECK (legal_status IS NULL OR legal_status IN ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl', 'autre'));

COMMENT ON COLUMN company_profiles.activity_type IS 'Type of activity - optional, required only for fiscal calculations';
COMMENT ON COLUMN company_profiles.creation_date IS 'Type of activity - optional, required only for fiscal calculations';
COMMENT ON COLUMN company_profiles.legal_status IS 'Legal status - optional, required only for fiscal calculations';
