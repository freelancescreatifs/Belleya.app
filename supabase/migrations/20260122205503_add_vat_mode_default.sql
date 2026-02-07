/*
  # Add DEFAULT value to vat_mode column

  1. Changes
    - Add DEFAULT 'VAT_FRANCHISE' to company_profiles.vat_mode
    - Add DEFAULT false to company_profiles.acre
    - Add DEFAULT false to company_profiles.versement_liberatoire
  
  2. Purpose
    - Prevent NOT NULL constraint violations when payload doesn't include vat_mode
    - Ensure all fiscal fields have safe defaults
    - Provide fallback at database level for robustness
  
  3. Notes
    - VAT_FRANCHISE is the default for most small businesses in France
    - Existing rows are not affected (already have values)
    - This is a safety net in addition to application-level fallbacks
*/

-- Add DEFAULT to vat_mode (must be one of the constraint values)
ALTER TABLE company_profiles
  ALTER COLUMN vat_mode SET DEFAULT 'VAT_FRANCHISE';

-- Ensure acre and versement_liberatoire have defaults (should already have them but double-check)
ALTER TABLE company_profiles
  ALTER COLUMN acre SET DEFAULT false;

ALTER TABLE company_profiles
  ALTER COLUMN versement_liberatoire SET DEFAULT false;
