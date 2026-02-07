/*
  # Add profession-specific fields to clients table

  1. Changes
    - Add `hair_type` for coiffeuse
    - Add `scalp_type` for coiffeuse  
    - Add `lash_type` for lash artist
    - Add `brow_type` for brow artist
    - Add `skin_conditions` for estheticienne/facialiste

  2. Notes
    - All fields are nullable (optional)
    - These fields will be displayed dynamically based on user's profession
    - Supports multi-profession mode where multiple sections can be shown
*/

-- Add hair_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS hair_type text;

-- Add scalp_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS scalp_type text;

-- Add lash_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS lash_type text;

-- Add brow_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS brow_type text;

-- Add skin_conditions column (text array for multiple conditions)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS skin_conditions text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN clients.hair_type IS 'Hair type/characteristics (for coiffeuse)';
COMMENT ON COLUMN clients.scalp_type IS 'Scalp condition (for coiffeuse)';
COMMENT ON COLUMN clients.lash_type IS 'Lash characteristics (for lash artist)';
COMMENT ON COLUMN clients.brow_type IS 'Brow characteristics (for brow artist)';
COMMENT ON COLUMN clients.skin_conditions IS 'Skin conditions (for estheticienne/facialiste)';