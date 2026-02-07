/*
  # Add client photo and enhanced fields

  ## Description
  This migration adds photo_url to the clients table to support
  client profile pictures and other enhanced client management features.

  ## Changes
  1. Add photo_url column to clients table
  2. No breaking changes - existing data remains intact

  ## New Columns
  - `photo_url` (text, nullable) - URL to client's profile photo

  ## Safety
  - Uses IF NOT EXISTS patterns where applicable
  - Non-destructive migration
  - Nullable column to allow existing records
*/

-- Add photo_url to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE clients ADD COLUMN photo_url text;
  END IF;
END $$;