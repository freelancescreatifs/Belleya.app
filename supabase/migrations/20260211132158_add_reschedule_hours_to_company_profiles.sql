/*
  # Add Reschedule Hours to Company Profiles

  1. Changes
    - Add `reschedule_hours` column to `company_profiles` table
      - Defines minimum hours before appointment when reschedule is allowed
      - Default: 24 hours
      - Providers can configure this value (24h, 48h, or custom)
  
  2. Usage
    - Used in client appointment reschedule flow
    - If appointment is less than X hours away, reschedule is blocked
    - Dynamic message shown to client based on this value
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'reschedule_hours'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN reschedule_hours integer DEFAULT 24;
  END IF;
END $$;
