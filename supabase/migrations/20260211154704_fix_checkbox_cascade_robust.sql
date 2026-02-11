/*
  # Fix Checkbox Cascade - Make it Robust

  ## Changes
  This migration improves the handle_checkbox_cascade function to:
  1. Handle NULL values safely
  2. Be more defensive with boolean comparisons
  3. Never fail - always return a valid result

  ## Cascading Logic
  - If Planifié is checked → auto-check all previous steps
  - If any step before Planifié is unchecked → uncheck Planifié
  - Cascading uncheck: Script → all, Tournage → Montage+Planifié, Montage → Planifié
*/

CREATE OR REPLACE FUNCTION handle_checkbox_cascade()
RETURNS TRIGGER AS $$
BEGIN
  -- Safely handle NULL values by treating them as false
  NEW.script_checked := COALESCE(NEW.script_checked, false);
  NEW.tournage_checked := COALESCE(NEW.tournage_checked, false);
  NEW.montage_checked := COALESCE(NEW.montage_checked, false);
  NEW.planifie_checked := COALESCE(NEW.planifie_checked, false);
  
  -- Also ensure OLD values are not NULL
  OLD.script_checked := COALESCE(OLD.script_checked, false);
  OLD.tournage_checked := COALESCE(OLD.tournage_checked, false);
  OLD.montage_checked := COALESCE(OLD.montage_checked, false);
  OLD.planifie_checked := COALESCE(OLD.planifie_checked, false);
  
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_checkbox_cascade ON content_calendar;
CREATE TRIGGER trigger_checkbox_cascade
BEFORE UPDATE OF script_checked, tournage_checked, montage_checked, planifie_checked
ON content_calendar
FOR EACH ROW
EXECUTE FUNCTION handle_checkbox_cascade();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_checkbox_cascade() TO authenticated;
