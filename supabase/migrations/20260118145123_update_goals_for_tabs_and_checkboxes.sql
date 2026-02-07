/*
  # Update Goals for Tabs and Sub-goal Checkboxes

  1. Changes to goals table
    - Update status constraint to support 4 tabs: not_started, in_progress, on_hold, achieved
    - Add 'checked' field for sub-goals (checkbox state)
    - Ensure proper structure for simplified sub-goals (title + target_date)

  2. Security
    - Maintains existing RLS policies
*/

-- Update status constraint to include 'on_hold'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'goals' AND constraint_name LIKE '%status%check'
  ) THEN
    ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;
  END IF;

  -- Add new constraint with 4 statuses
  ALTER TABLE goals ADD CONSTRAINT goals_status_check 
    CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'achieved', 'missed'));
END $$;

-- Add checked field for sub-goals (to track checkbox state)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'checked'
  ) THEN
    ALTER TABLE goals ADD COLUMN checked boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better performance on checked field
CREATE INDEX IF NOT EXISTS idx_goals_checked ON goals(checked);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id) WHERE parent_goal_id IS NOT NULL;