/*
  # Enhance client profile with additional fields

  ## Description
  This migration adds new fields to the clients table to support
  enhanced client management features including birth date for
  personalized communication and loyalty tracking.

  ## Changes
  1. Add birth_date field to clients table (optional date)
  2. Add loyalty_points field for future loyalty program
  3. Add preferred_contact field for communication preferences

  ## New Columns
  - `birth_date` (date, nullable) - Client birth date for birthday reminders
  - `loyalty_points` (integer, default 0) - Points accumulated for loyalty program
  - `preferred_contact` (text, nullable) - Preferred contact method (phone/email/sms)

  ## Safety
  - Uses IF NOT EXISTS pattern
  - Non-destructive migration
  - Default values ensure existing records work correctly
*/

-- Add birth_date column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE clients ADD COLUMN birth_date date;
  END IF;
END $$;

-- Add loyalty_points column for loyalty program
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'loyalty_points'
  ) THEN
    ALTER TABLE clients ADD COLUMN loyalty_points integer DEFAULT 0;
  END IF;
END $$;

-- Add preferred_contact column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'preferred_contact'
  ) THEN
    ALTER TABLE clients ADD COLUMN preferred_contact text CHECK (preferred_contact IN ('phone', 'email', 'sms', 'instagram'));
  END IF;
END $$;

-- Create index for birthday queries (useful for birthday reminders)
CREATE INDEX IF NOT EXISTS idx_clients_birth_date ON clients(birth_date) WHERE birth_date IS NOT NULL;