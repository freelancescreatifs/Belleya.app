/*
  # Add time fields to tasks for timeline view

  1. Changes
    - Add `start_time` column (time without timezone) to tasks table
    - Add `end_time` column (time without timezone) to tasks table
    - These fields enable time-specific scheduling for the day timeline view

  2. Notes
    - Both fields are optional (NULL allowed)
    - Used for tasks with specific time slots
    - Tasks without times will appear in "Sans horaire" section
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_time time DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN end_time time DEFAULT NULL;
  END IF;
END $$;
