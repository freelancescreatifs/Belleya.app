/*
  # Add client archiving system

  ## Description
  This migration adds soft delete functionality to the clients table,
  allowing clients to be archived instead of permanently deleted.

  ## Changes
  1. Add is_archived column to clients table (default: false)
  2. Archived clients are excluded from default queries but can be filtered

  ## New Columns
  - `is_archived` (boolean, default false) - Soft delete flag for client archiving

  ## Safety
  - Uses IF NOT EXISTS pattern
  - Non-destructive migration
  - Default value ensures existing records are not archived
*/

-- Add is_archived column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better query performance on archived filter
CREATE INDEX IF NOT EXISTS idx_clients_is_archived ON clients(is_archived);
CREATE INDEX IF NOT EXISTS idx_clients_user_id_is_archived ON clients(user_id, is_archived);