/*
  # Add TIME columns to content_calendar for production steps
  
  ## Problem
  The production time columns were never explicitly created in content_calendar table.
  The sync_production_tasks() function tries to cast them to TIME type but they don't exist.
  
  ## Solution
  Add TIME WITHOUT TIME ZONE columns for each production step:
  - date_script_time
  - date_shooting_time
  - date_editing_time
  - date_scheduling_time
  
  ## Notes
  - All columns are nullable
  - Default to NULL (no default time)
  - Type: TIME WITHOUT TIME ZONE (format HH:MM:SS required)
  - The end_time columns already exist as TEXT type
*/

DO $$
BEGIN
  -- Add script time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_script_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_script_time time;
  END IF;

  -- Add shooting time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_shooting_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_shooting_time time;
  END IF;

  -- Add editing time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_editing_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_editing_time time;
  END IF;

  -- Add scheduling time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_scheduling_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_scheduling_time time;
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, UPDATE ON content_calendar TO authenticated;
