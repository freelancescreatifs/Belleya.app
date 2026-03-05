/*
  # Fix affiliates status constraint and add soft delete

  1. Modified Tables
    - `affiliates`
      - Update `affiliates_status_check` constraint to include 'disabled' value
      - Add `deleted_at` (timestamptz, nullable) for soft delete functionality

  2. Changes
    - The existing constraint only allows: 'pending', 'active', 'observation', 'paused'
    - The admin UI needs 'disabled' status, which was causing constraint violations
    - Adding soft delete via `deleted_at` column for clean affiliate removal

  3. Important Notes
    - Existing data is preserved, no destructive operations
    - Affiliates with `deleted_at IS NOT NULL` should be excluded from active queries
*/

ALTER TABLE affiliates
  DROP CONSTRAINT IF EXISTS affiliates_status_check;

ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_status_check
  CHECK (status = ANY (ARRAY['pending', 'active', 'observation', 'paused', 'disabled']));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;
