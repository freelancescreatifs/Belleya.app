/*
  # Add training_service_id to students table

  1. Changes
    - Add `training_service_id` column to `students` table (nullable foreign key)
    - References `services` table
    - Used to link a student to the training/formation they are following
    - Only services with type='formation' should be selectable

  2. Notes
    - Column is nullable since it's optional
    - Maintains referential integrity with services table
    - No data loss on service deletion (SET NULL)
*/

-- Add training_service_id column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS training_service_id uuid REFERENCES services(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_training_service_id ON students(training_service_id);

-- Add comment for documentation
COMMENT ON COLUMN students.training_service_id IS 'Formation/training service this student is following';