/*
  # Add birth_date to clients table

  1. Changes
    - Add `birth_date` column to `clients` table (nullable date)
    - Used to store client's date of birth
    - Optional field for client profiles

  2. Notes
    - Column is nullable since it's optional
    - Uses date type (not timestamp) for birth dates
    - No default value
*/

-- Add birth_date column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS birth_date date;

-- Add comment for documentation
COMMENT ON COLUMN clients.birth_date IS 'Client date of birth (optional)';