/*
  # Add start and end dates to goals table

  ## Changes
  - Add start_date column to goals table
  - Add end_date column to goals table

  ## Purpose
  Allow users to set start and end dates for their goals to better track timelines.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN end_date date;
  END IF;
END $$;