/*
  # Add training start date and level to students
  
  ## Description
  This migration adds critical fields to the students table to support proper
  training lifecycle management and multi-level training programs.
  
  ## Changes
  1. Add training_start_date to students table - Required for status determination
  2. Add training_level to students table - Optional field for multi-level programs
  3. Update existing students with default training_start_date based on earliest training
  
  ## New Fields
  - `training_start_date` (date, not null) - The actual start date of the training
    This is different from created_at and determines the training status
  - `training_level` (text, nullable) - Training level (e.g., "beginner", "advanced")
    Optional field for programs with multiple levels
  
  ## Safety
  - Uses conditional checks to avoid errors if fields already exist
  - Backfills existing records with reasonable defaults
*/

-- Add training_start_date to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'training_start_date'
  ) THEN
    ALTER TABLE students
    ADD COLUMN training_start_date date;
  END IF;
END $$;

-- Add training_level to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'training_level'
  ) THEN
    ALTER TABLE students
    ADD COLUMN training_level text;
  END IF;
END $$;

-- Backfill training_start_date for existing students
-- Use the earliest training_date from student_trainings or created_at if no trainings
UPDATE students s
SET training_start_date = COALESCE(
  (SELECT MIN(st.training_date)
   FROM student_trainings st
   WHERE st.student_id = s.id),
  s.created_at::date
)
WHERE training_start_date IS NULL;

-- Make training_start_date NOT NULL after backfill
ALTER TABLE students
ALTER COLUMN training_start_date SET NOT NULL;

-- Add default value for new records
ALTER TABLE students
ALTER COLUMN training_start_date SET DEFAULT CURRENT_DATE;