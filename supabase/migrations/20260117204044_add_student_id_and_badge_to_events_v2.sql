/*
  # Add student support and badge system to events

  1. Changes
    - Add `student_id` column to `events` table (nullable foreign key)
    - Add `badge_type` column to store icon type (student/fidele/vip)
    - Add index for faster student event lookups
    - Update type constraint to include 'pro' and 'formation' event types

  2. Purpose
    - Enable linking events to students for training appointments
    - Store badge type for visual differentiation in agenda
    - Support formation/training events in addition to client events
    - Fix constraint to include existing 'pro' type
*/

-- Add student_id column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL;

-- Add badge_type for icon display (student/fidele/vip)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS badge_type text CHECK (badge_type IN ('student', 'fidele', 'vip'));

-- Update type constraint to include 'pro' and 'formation'
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
  
  -- Add new constraint with all types including 'pro' and 'formation'
  ALTER TABLE events ADD CONSTRAINT events_type_check 
    CHECK (type IN ('client', 'personal', 'google', 'planity', 'pro', 'formation'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add index for student lookups
CREATE INDEX IF NOT EXISTS idx_events_student_id ON events(student_id);

-- Add comments
COMMENT ON COLUMN events.student_id IS 'Student associated with this event (for formation/training appointments)';
COMMENT ON COLUMN events.badge_type IS 'Badge icon type: student (🎓), fidele (⭐), vip (💎)';
