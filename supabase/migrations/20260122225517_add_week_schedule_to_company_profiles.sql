/*
  # Add week_schedule column to company_profiles

  ## Overview
  Add a simplified week schedule format for booking availability.
  This format is easier for clients to query when booking appointments.

  ## Changes
  - Add `week_schedule` column as JSONB
  - This will store a simple format: { monday: {is_open: true, start_time: "09:00", end_time: "18:00"}, ... }

  ## Format
  The week_schedule format is:
  {
    "monday": { "is_open": boolean, "start_time": "HH:mm", "end_time": "HH:mm" },
    "tuesday": { "is_open": boolean, "start_time": "HH:mm", "end_time": "HH:mm" },
    ...
  }
*/

-- Add week_schedule column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'week_schedule'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN week_schedule jsonb;
  END IF;
END $$;
