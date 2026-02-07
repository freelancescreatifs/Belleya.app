/*
  # Add student_id to revenues table for training tracking

  1. Changes
    - Add `student_id` column to `revenues` table (nullable foreign key)
    - References `students` table
    - Used when revenue type is 'formation' to link to a specific student
    - Allows tracking which student each training revenue is associated with

  2. Notes
    - Column is nullable since not all revenue types require a student
    - Only required when type = 'formation'
    - Maintains referential integrity with students table
    - No data loss on student deletion (SET NULL)
*/

-- Add student_id column to revenues table
ALTER TABLE revenues
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL;

-- Add index for faster lookups when filtering by student
CREATE INDEX IF NOT EXISTS idx_revenues_student_id ON revenues(student_id);

-- Add comment for documentation
COMMENT ON COLUMN revenues.student_id IS 'Student associated with this training revenue (when type=formation)';