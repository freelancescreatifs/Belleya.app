/*
  # Add last_completed_date to tasks table

  1. Changes
    - Add `last_completed_date` column to `tasks` table
      - This column will track when a recurring task was last completed
      - Used to reset daily recurring tasks at midnight
  
  2. Notes
    - This field is nullable and only used for recurring tasks
    - It stores the date (not datetime) when the task was last marked as completed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'last_completed_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN last_completed_date date;
  END IF;
END $$;