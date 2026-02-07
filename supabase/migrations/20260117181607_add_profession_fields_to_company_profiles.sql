/*
  # Add profession fields to company_profiles

  1. Changes
    - Add `primary_profession` column (stores the main profession key)
    - Add `additional_professions` column (array for multi-profession mode)
    - These replace the old activity_type/activity_types pattern

  2. Notes
    - primary_profession uses snake_case keys (nail_artist, estheticienne, etc.)
    - additional_professions is only used when primary_profession = 'multi_metiers'
    - Both columns are nullable for backward compatibility
*/

-- Add primary_profession column to company_profiles table
ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS primary_profession text;

-- Add additional_professions column (array of text)
ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS additional_professions text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN company_profiles.primary_profession IS 'Main profession key (nail_artist, estheticienne, coiffeuse, etc.)';
COMMENT ON COLUMN company_profiles.additional_professions IS 'Additional professions when primary_profession is multi_metiers';