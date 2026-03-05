/*
  # Enhance affiliates table for Belaya admin management

  1. Modified Tables
    - `affiliates`
      - `program` (text, default 'belaya_affiliation') - identifies source program
      - `bonus_amount` (numeric, default 0) - admin-editable bonus
      - `bonus_note` (text, nullable) - admin note for bonus
      - `approved_at` (timestamptz, nullable) - when affiliate was approved

  2. Data Migration
    - Sets `program = 'belaya_affiliation'` for all existing affiliates
    - Sets `approved_at = created_at` for all existing active affiliates

  3. Indexes
    - Index on `affiliates(program)` for fast filtering
    - Index on `affiliates(status, program)` for admin queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'program'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN program text DEFAULT 'belaya_affiliation' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'bonus_amount'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN bonus_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'bonus_note'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN bonus_note text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

UPDATE affiliates SET program = 'belaya_affiliation' WHERE program IS NULL OR program = '';
UPDATE affiliates SET approved_at = created_at WHERE approved_at IS NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_affiliates_program ON affiliates(program);
CREATE INDEX IF NOT EXISTS idx_affiliates_status_program ON affiliates(status, program);
