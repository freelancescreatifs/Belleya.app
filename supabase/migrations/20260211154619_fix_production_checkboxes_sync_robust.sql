/*
  # Fix Production Checkboxes Sync - Make it Robust

  ## Changes
  This migration fixes the sync between production checkboxes and tasks by:
  1. Making the sync function more robust (doesn't fail if tasks don't exist)
  2. Only updates tasks if they exist
  3. Logs errors without blocking the checkbox update

  ## Important Notes
  - The checkbox update should NEVER fail even if task sync fails
  - Tasks are optional - content can exist without production tasks
  - The trigger is AFTER UPDATE so it won't block the main update
*/

-- Drop and recreate the sync function with better error handling
CREATE OR REPLACE FUNCTION sync_production_checkboxes_to_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- This function runs AFTER the update, so we log errors but don't raise them
  
  -- Handle Script checkbox
  IF NEW.script_checked != COALESCE(OLD.script_checked, false) THEN
    BEGIN
      UPDATE tasks 
      SET 
        completed = NEW.script_checked, 
        last_completed_date = CASE WHEN NEW.script_checked THEN CURRENT_DATE ELSE NULL END
      WHERE content_id = NEW.id 
        AND tags::text LIKE '%Script%'
        AND user_id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail
      RAISE WARNING 'Failed to sync Script task for content %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- Handle Tournage checkbox
  IF NEW.tournage_checked != COALESCE(OLD.tournage_checked, false) THEN
    BEGIN
      UPDATE tasks 
      SET 
        completed = NEW.tournage_checked, 
        last_completed_date = CASE WHEN NEW.tournage_checked THEN CURRENT_DATE ELSE NULL END
      WHERE content_id = NEW.id 
        AND tags::text LIKE '%Tournage%'
        AND user_id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to sync Tournage task for content %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- Handle Montage checkbox
  IF NEW.montage_checked != COALESCE(OLD.montage_checked, false) THEN
    BEGIN
      UPDATE tasks 
      SET 
        completed = NEW.montage_checked, 
        last_completed_date = CASE WHEN NEW.montage_checked THEN CURRENT_DATE ELSE NULL END
      WHERE content_id = NEW.id 
        AND tags::text LIKE '%Montage%'
        AND user_id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to sync Montage task for content %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- Handle Planifié checkbox
  IF NEW.planifie_checked != COALESCE(OLD.planifie_checked, false) THEN
    BEGIN
      UPDATE tasks 
      SET 
        completed = NEW.planifie_checked, 
        last_completed_date = CASE WHEN NEW.planifie_checked THEN CURRENT_DATE ELSE NULL END
      WHERE content_id = NEW.id 
        AND tags::text LIKE '%Planification%'
        AND user_id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to sync Planifié task for content %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- Always return NEW to allow the update to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_sync_checkboxes_to_tasks ON content_calendar;
CREATE TRIGGER trigger_sync_checkboxes_to_tasks
AFTER UPDATE OF script_checked, tournage_checked, montage_checked, planifie_checked
ON content_calendar
FOR EACH ROW
EXECUTE FUNCTION sync_production_checkboxes_to_tasks();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_production_checkboxes_to_tasks() TO authenticated;
