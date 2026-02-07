/*
  # Add end date, formation link, and photo to students table

  ## Description
  This migration enhances the students table with essential fields for automatic
  status calculation and improved student management:
  - Training end date for automatic status determination
  - Formation service link to connect students with their training programs
  - Photo URL for student profile pictures

  ## Changes
  1. Add training_end_date column
     - Type: date, not null
     - Required for automatic status calculation based on date range
     - Backfilled with start_date + 90 days for existing records

  2. Add formation_id column
     - Type: uuid, nullable
     - Foreign key to services table
     - Links student to their training service (service_type = 'formation')
     - Optional field (students can exist without a linked formation)

  3. Add photo_url column
     - Type: text, nullable
     - Stores student profile picture URL
     - Optional field

  ## New Fields
  - `training_end_date` (date, not null) - End date of training
  - `formation_id` (uuid, nullable) - Reference to services(id) for training service
  - `photo_url` (text, nullable) - URL to student profile photo

  ## Status Logic (Automatic)
  Based on these dates, status is calculated as:
  - today < training_start_date → 'upcoming'
  - today >= training_start_date AND today <= training_end_date → 'in_progress'
  - today > training_end_date → 'completed'

  ## Safety
  - Uses conditional checks to avoid errors if fields already exist
  - Backfills existing records with reasonable defaults
  - Adds foreign key constraint with CASCADE on delete
  - No data loss
*/

-- Add training_end_date to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'training_end_date'
  ) THEN
    ALTER TABLE students
    ADD COLUMN training_end_date date;
  END IF;
END $$;

-- Add formation_id to students table (reference to services)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'formation_id'
  ) THEN
    ALTER TABLE students
    ADD COLUMN formation_id uuid REFERENCES services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add photo_url to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE students
    ADD COLUMN photo_url text;
  END IF;
END $$;

-- Backfill training_end_date for existing students
-- Default: 90 days after start date (typical training duration)
UPDATE students
SET training_end_date = training_start_date + INTERVAL '90 days'
WHERE training_end_date IS NULL;

-- Make training_end_date NOT NULL after backfill
ALTER TABLE students
ALTER COLUMN training_end_date SET NOT NULL;

-- Add index on formation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_formation_id
ON students(formation_id);

-- Add index on training dates for status queries
CREATE INDEX IF NOT EXISTS idx_students_training_dates
ON students(training_start_date, training_end_date);