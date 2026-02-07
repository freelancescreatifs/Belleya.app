/*
  # Link Revenues to Partnerships

  1. Changes
    - Add `partnership_id` column to `revenues` table to link commission revenues to partnerships
    - Add foreign key constraint to ensure data integrity
    - Add index for better query performance

  2. Purpose
    - Enable linking commission revenues to specific partnerships
    - Avoid duplicate data entry
    - Maintain consistency between revenues and partnerships
*/

-- Add partnership_id column to revenues
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenues' AND column_name = 'partnership_id'
  ) THEN
    ALTER TABLE revenues ADD COLUMN partnership_id uuid REFERENCES partnerships(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_revenues_partnership_id ON revenues(partnership_id);

-- Add comment for documentation
COMMENT ON COLUMN revenues.partnership_id IS 'Links commission revenues to specific partnerships';