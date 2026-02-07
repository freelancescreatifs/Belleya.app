/*
  # Add banned status to clients

  1. Changes
    - Add `banned` boolean column to `clients` table
      - Default: false
      - Indexed for filtering
    - Add `banned_at` timestamp column to track when a client was banned
    - Add `banned_reason` text column for optional ban reason

  2. Notes
    - Banned clients remain in the database for historical records
    - The banned status is separate from archived status (is_archived)
    - A client can be both banned and archived
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_reason'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_reason text;
  END IF;
END $$;

-- Create index for filtering banned clients
CREATE INDEX IF NOT EXISTS idx_clients_banned ON clients(banned) WHERE banned = true;
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(is_archived) WHERE is_archived = true;