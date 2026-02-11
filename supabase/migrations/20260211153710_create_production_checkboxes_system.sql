/*
  # Production Checkboxes System - Complete Workflow Implementation

  ## Overview
  This migration implements a complete production workflow system with:
  - Production step checkboxes (Script, Tournage, Montage, Planifié)
  - Automatic status calculation based on checkboxes and publication date
  - Real-time "Publié" tag logic based on date/time
  - Late/Retard indicator system
  - Full synchronization between Day View, Agenda, and Tasks

  ## New Columns Added to content_calendar

  ### Production Checkboxes
  - `script_checked` (boolean, default false) - Script completion status
  - `tournage_checked` (boolean, default false) - Shooting completion status
  - `montage_checked` (boolean, default false) - Editing completion status
  - `planifie_checked` (boolean, default false) - Scheduled completion status

  ### Status Tracking
  - `is_fully_produced` (boolean, computed) - True when all production steps are checked
  - `is_published_status` (text) - 'published' or 'not_published' based on date logic

  ## Logic Rules

  ### Checkbox Cascading
  1. Checking "Planifié" → auto-checks Script, Tournage, Montage
  2. Unchecking any step before "Planifié" → auto-unchecks Planifié
  3. All steps checked → is_fully_produced = true

  ### Status Tag Logic
  - If all steps checked AND publication_date has passed → "Publié"
  - If all steps checked BUT publication_date is future → "Non publié"
  - If not all steps checked → "Non publié"

  ### Late Indicator Logic
  - Step becomes "Late" if current_date > step_date AND step not checked
  - Original production dates remain unchanged

  ## Synchronization
  - Checking a step → removes it from active tasks
  - Unchecking a step → adds it back to tasks
  - Deleting a post → cascades to delete all related tasks
*/

-- Add production checkbox columns to content_calendar
ALTER TABLE content_calendar
ADD COLUMN IF NOT EXISTS script_checked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tournage_checked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS montage_checked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS planifie_checked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_fully_produced boolean GENERATED ALWAYS AS (
  script_checked AND tournage_checked AND montage_checked AND planifie_checked
) STORED,
ADD COLUMN IF NOT EXISTS is_published_status text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_production_status 
ON content_calendar(is_fully_produced, publication_date);

-- Function to calculate published status based on date and checkboxes
CREATE OR REPLACE FUNCTION calculate_published_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If all production steps are checked
  IF NEW.script_checked AND NEW.tournage_checked AND NEW.montage_checked AND NEW.planifie_checked THEN
    -- Check if publication date has passed
    IF NEW.publication_date IS NOT NULL AND 
       (NEW.publication_date::date < CURRENT_DATE OR 
        (NEW.publication_date::date = CURRENT_DATE AND 
         COALESCE(NEW.publication_time, '00:00')::time <= CURRENT_TIME)) THEN
      NEW.is_published_status := 'published';
    ELSE
      NEW.is_published_status := 'not_published';
    END IF;
  ELSE
    NEW.is_published_status := 'not_published';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate published status on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_published_status ON content_calendar;
CREATE TRIGGER trigger_calculate_published_status
BEFORE INSERT OR UPDATE OF script_checked, tournage_checked, montage_checked, planifie_checked, publication_date, publication_time
ON content_calendar
FOR EACH ROW
EXECUTE FUNCTION calculate_published_status();

-- Function to handle cascading checkbox logic
CREATE OR REPLACE FUNCTION handle_checkbox_cascade()
RETURNS TRIGGER AS $$
BEGIN
  -- If Planifié is being checked, auto-check all previous steps
  IF NEW.planifie_checked = true AND OLD.planifie_checked = false THEN
    NEW.script_checked := true;
    NEW.tournage_checked := true;
    NEW.montage_checked := true;
  END IF;
  
  -- If any step before Planifié is unchecked, uncheck Planifié
  IF (NEW.script_checked = false OR NEW.tournage_checked = false OR NEW.montage_checked = false) 
     AND OLD.planifie_checked = true THEN
    NEW.planifie_checked := false;
  END IF;
  
  -- Cascading uncheck: if Script is unchecked, uncheck everything after
  IF NEW.script_checked = false AND OLD.script_checked = true THEN
    NEW.tournage_checked := false;
    NEW.montage_checked := false;
    NEW.planifie_checked := false;
  END IF;
  
  -- Cascading uncheck: if Tournage is unchecked, uncheck Montage and Planifié
  IF NEW.tournage_checked = false AND OLD.tournage_checked = true THEN
    NEW.montage_checked := false;
    NEW.planifie_checked := false;
  END IF;
  
  -- Cascading uncheck: if Montage is unchecked, uncheck Planifié
  IF NEW.montage_checked = false AND OLD.montage_checked = true THEN
    NEW.planifie_checked := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for checkbox cascading logic
DROP TRIGGER IF EXISTS trigger_checkbox_cascade ON content_calendar;
CREATE TRIGGER trigger_checkbox_cascade
BEFORE UPDATE OF script_checked, tournage_checked, montage_checked, planifie_checked
ON content_calendar
FOR EACH ROW
EXECUTE FUNCTION handle_checkbox_cascade();

-- Function to sync production checkboxes with tasks
CREATE OR REPLACE FUNCTION sync_production_checkboxes_to_tasks()
RETURNS TRIGGER AS $$
DECLARE
  task_prefix text;
  task_tag text;
  task_date date;
  task_time time;
  step_name text;
BEGIN
  -- Handle Script checkbox
  IF NEW.script_checked != COALESCE(OLD.script_checked, false) THEN
    IF NEW.script_checked = true THEN
      -- Mark task as completed
      UPDATE tasks 
      SET completed = true, last_completed_date = CURRENT_DATE
      WHERE content_id = NEW.id AND tags::text LIKE '%Script%'
      AND user_id = NEW.user_id;
    ELSE
      -- Mark task as not completed
      UPDATE tasks 
      SET completed = false, last_completed_date = NULL
      WHERE content_id = NEW.id AND tags::text LIKE '%Script%'
      AND user_id = NEW.user_id;
    END IF;
  END IF;

  -- Handle Tournage checkbox
  IF NEW.tournage_checked != COALESCE(OLD.tournage_checked, false) THEN
    IF NEW.tournage_checked = true THEN
      UPDATE tasks 
      SET completed = true, last_completed_date = CURRENT_DATE
      WHERE content_id = NEW.id AND tags::text LIKE '%Tournage%'
      AND user_id = NEW.user_id;
    ELSE
      UPDATE tasks 
      SET completed = false, last_completed_date = NULL
      WHERE content_id = NEW.id AND tags::text LIKE '%Tournage%'
      AND user_id = NEW.user_id;
    END IF;
  END IF;

  -- Handle Montage checkbox
  IF NEW.montage_checked != COALESCE(OLD.montage_checked, false) THEN
    IF NEW.montage_checked = true THEN
      UPDATE tasks 
      SET completed = true, last_completed_date = CURRENT_DATE
      WHERE content_id = NEW.id AND tags::text LIKE '%Montage%'
      AND user_id = NEW.user_id;
    ELSE
      UPDATE tasks 
      SET completed = false, last_completed_date = NULL
      WHERE content_id = NEW.id AND tags::text LIKE '%Montage%'
      AND user_id = NEW.user_id;
    END IF;
  END IF;

  -- Handle Planifié checkbox
  IF NEW.planifie_checked != COALESCE(OLD.planifie_checked, false) THEN
    IF NEW.planifie_checked = true THEN
      UPDATE tasks 
      SET completed = true, last_completed_date = CURRENT_DATE
      WHERE content_id = NEW.id AND tags::text LIKE '%Planification%'
      AND user_id = NEW.user_id;
    ELSE
      UPDATE tasks 
      SET completed = false, last_completed_date = NULL
      WHERE content_id = NEW.id AND tags::text LIKE '%Planification%'
      AND user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync checkboxes to tasks
DROP TRIGGER IF EXISTS trigger_sync_checkboxes_to_tasks ON content_calendar;
CREATE TRIGGER trigger_sync_checkboxes_to_tasks
AFTER UPDATE OF script_checked, tournage_checked, montage_checked, planifie_checked
ON content_calendar
FOR EACH ROW
EXECUTE FUNCTION sync_production_checkboxes_to_tasks();

-- Update existing rows to have default checkbox values
UPDATE content_calendar
SET 
  script_checked = COALESCE(script_checked, false),
  tournage_checked = COALESCE(tournage_checked, false),
  montage_checked = COALESCE(montage_checked, false),
  planifie_checked = COALESCE(planifie_checked, false)
WHERE script_checked IS NULL 
   OR tournage_checked IS NULL 
   OR montage_checked IS NULL 
   OR planifie_checked IS NULL;

-- Create helper function to check if step is late
CREATE OR REPLACE FUNCTION is_production_step_late(
  step_date date,
  step_time time,
  is_checked boolean
)
RETURNS boolean AS $$
BEGIN
  IF is_checked THEN
    RETURN false;
  END IF;
  
  IF step_date IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if current date/time is past the step date/time
  IF step_date < CURRENT_DATE THEN
    RETURN true;
  END IF;
  
  IF step_date = CURRENT_DATE AND step_time IS NOT NULL AND step_time < CURRENT_TIME THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_published_status() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_checkbox_cascade() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_production_checkboxes_to_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION is_production_step_late(date, time, boolean) TO authenticated;
