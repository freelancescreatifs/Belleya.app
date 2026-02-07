/*
  # Fix Task Priority Constraint

  1. Problem
    - Current CHECK constraint only accepts: 'high', 'medium', 'low'
    - Frontend sends 'very_high' for urgent tasks, causing silent failures
    - Tasks with "🔥 Urgente" priority cannot be created

  2. Solution
    - Drop existing constraint
    - Add new constraint that accepts: 'very_high', 'high', 'medium', 'low'

  3. Changes
    - Modify tasks table priority constraint to support very_high priority level
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_priority_check'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_priority_check;
  END IF;
END $$;

-- Add new constraint with very_high support
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('very_high', 'high', 'medium', 'low'));