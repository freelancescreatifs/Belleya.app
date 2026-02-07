/*
  # Fix Partnerships Schema

  1. Changes
    - Migrate data from old columns to new columns
    - Remove old columns
    - Make new columns NOT NULL where needed
*/

-- First, migrate any existing data from old columns to new columns
UPDATE partnerships
SET company_name = brand_name
WHERE company_name IS NULL AND brand_name IS NOT NULL;

-- Drop old columns that are no longer needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'brand_name') THEN
    ALTER TABLE partnerships DROP COLUMN brand_name;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'collaboration_type') THEN
    ALTER TABLE partnerships DROP COLUMN collaboration_type;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'benefits') THEN
    ALTER TABLE partnerships DROP COLUMN benefits;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'obligations') THEN
    ALTER TABLE partnerships DROP COLUMN obligations;
  END IF;
END $$;

-- Make company_name NOT NULL with default value first
ALTER TABLE partnerships ALTER COLUMN company_name SET DEFAULT 'Sans nom';
UPDATE partnerships SET company_name = 'Sans nom' WHERE company_name IS NULL;
ALTER TABLE partnerships ALTER COLUMN company_name SET NOT NULL;

-- Set NOT NULL on other essential columns with defaults
ALTER TABLE partnerships ALTER COLUMN partnership_type SET DEFAULT 'affiliation';
UPDATE partnerships SET partnership_type = 'affiliation' WHERE partnership_type IS NULL;
ALTER TABLE partnerships ALTER COLUMN partnership_type SET NOT NULL;

ALTER TABLE partnerships ALTER COLUMN commission_rate SET DEFAULT 0;
UPDATE partnerships SET commission_rate = 0 WHERE commission_rate IS NULL;
ALTER TABLE partnerships ALTER COLUMN commission_rate SET NOT NULL;

ALTER TABLE partnerships ALTER COLUMN compensation_mode SET DEFAULT 'percentage';
UPDATE partnerships SET compensation_mode = 'percentage' WHERE compensation_mode IS NULL;
ALTER TABLE partnerships ALTER COLUMN compensation_mode SET NOT NULL;

-- Set other default values
ALTER TABLE partnerships ALTER COLUMN estimated_goal SET DEFAULT 0;
ALTER TABLE partnerships ALTER COLUMN is_default SET DEFAULT false;
ALTER TABLE partnerships ALTER COLUMN is_client_support_involved SET DEFAULT false;
ALTER TABLE partnerships ALTER COLUMN status SET DEFAULT 'active';
