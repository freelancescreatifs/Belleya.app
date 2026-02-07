/*
  # Add Production Dates to Content Calendar

  1. New Columns Added to content_calendar
    - `date_script` (date) - Date for script writing
    - `date_shooting` (date) - Date for shooting/filming
    - `date_editing` (date) - Date for video editing
    - `date_subtitles` (date) - Date for subtitles and exports
    - `date_validation` (date) - Date for content validation
    - `date_scheduling` (date) - Date for scheduling/programming
    - `production_auto_plan` (boolean) - Flag to indicate if auto-planning is enabled
    - `production_start_date` (date) - Start date for auto-planning
    
  2. Purpose
    - Track production stages independently from publication calendar
    - Enable production calendar view separate from editorial calendar
    - Support automatic timeline generation
    - Alert on overdue production stages

  3. Notes
    - All date fields are nullable to allow flexible workflow
    - publication_date remains the main editorial calendar date
    - These fields feed the production calendar only
*/

DO $$
BEGIN
  -- Add script date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_script'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_script date;
  END IF;

  -- Add shooting date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_shooting'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_shooting date;
  END IF;

  -- Add editing date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_editing'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_editing date;
  END IF;

  -- Add subtitles date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_subtitles'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_subtitles date;
  END IF;

  -- Add validation date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_validation'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_validation date;
  END IF;

  -- Add scheduling date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'date_scheduling'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN date_scheduling date;
  END IF;

  -- Add auto-planning flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'production_auto_plan'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN production_auto_plan boolean DEFAULT false;
  END IF;

  -- Add production start date for auto-planning
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'production_start_date'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN production_start_date date;
  END IF;
END $$;

-- Create index for production date queries
CREATE INDEX IF NOT EXISTS idx_content_calendar_date_script ON content_calendar(date_script) WHERE date_script IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_calendar_date_shooting ON content_calendar(date_shooting) WHERE date_shooting IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_calendar_date_editing ON content_calendar(date_editing) WHERE date_editing IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_calendar_date_subtitles ON content_calendar(date_subtitles) WHERE date_subtitles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_calendar_date_validation ON content_calendar(date_validation) WHERE date_validation IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_calendar_date_scheduling ON content_calendar(date_scheduling) WHERE date_scheduling IS NOT NULL;
