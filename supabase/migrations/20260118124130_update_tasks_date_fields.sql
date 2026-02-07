/*
  # Update tasks date fields for period support

  1. Changes
    - Rename `due_date` to `end_date` for clarity
    - Add `start_date` column for task commencement date
    - Update existing data to preserve dates (due_date becomes end_date)

  2. Notes
    - Tasks can now have a period (start_date to end_date)
    - Both fields are optional
    - start_time and end_time work with these dates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_date date DEFAULT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks RENAME COLUMN due_date TO end_date;
  END IF;
END $$;
