/*
  # Sync Production Status with Day View

  1. Data Backfill
    - For content with status 'published': set all 4 checkboxes (script_checked, tournage_checked, montage_checked, planifie_checked) to true
    - For content with status 'scheduled': set script_checked=true, tournage_checked=true (if date_shooting exists), montage_checked=true (if date_editing exists), planifie_checked=true
    - For content with status 'editing': set script_checked=true, tournage_checked=true (if date_shooting exists)
    - For content with status 'shooting': set script_checked=true

  2. Sync step_*_completed columns with *_checked columns
    - Ensures both checkbox systems are in sync

  3. Updated Function
    - `determine_content_status()` now uses checkbox states as primary signal
    - Returns the step name of the first unchecked relevant step
    - Returns 'published' if all steps checked AND publication_date is in the past

  4. Important Notes
    - No destructive operations - only updates existing data
    - Backfill is idempotent (safe to run multiple times)
*/

-- Step 1: Backfill checkboxes based on current status
-- Published content: all checkboxes should be true
UPDATE content_calendar
SET 
  script_checked = true,
  tournage_checked = true,
  montage_checked = true,
  planifie_checked = true,
  step_script_completed = true,
  step_shooting_completed = true,
  step_editing_completed = true,
  step_scheduling_completed = true
WHERE status = 'published'
AND (script_checked = false OR tournage_checked = false OR montage_checked = false OR planifie_checked = false);

-- Scheduled content: all relevant checkboxes should be true up to scheduling
UPDATE content_calendar
SET 
  script_checked = true,
  tournage_checked = CASE WHEN date_shooting IS NOT NULL THEN true ELSE tournage_checked END,
  montage_checked = CASE WHEN date_editing IS NOT NULL THEN true ELSE montage_checked END,
  planifie_checked = true,
  step_script_completed = true,
  step_shooting_completed = CASE WHEN date_shooting IS NOT NULL THEN true ELSE step_shooting_completed END,
  step_editing_completed = CASE WHEN date_editing IS NOT NULL THEN true ELSE step_editing_completed END,
  step_scheduling_completed = true
WHERE status = 'scheduled'
AND (script_checked = false OR planifie_checked = false);

-- Editing content: script and tournage should be checked
UPDATE content_calendar
SET 
  script_checked = true,
  tournage_checked = CASE WHEN date_shooting IS NOT NULL THEN true ELSE tournage_checked END,
  step_script_completed = true,
  step_shooting_completed = CASE WHEN date_shooting IS NOT NULL THEN true ELSE step_shooting_completed END
WHERE status = 'editing'
AND (script_checked = false);

-- Shooting content: script should be checked
UPDATE content_calendar
SET 
  script_checked = true,
  step_script_completed = true
WHERE status = 'shooting'
AND script_checked = false;

-- Step 2: Sync step_*_completed from *_checked for any remaining mismatches
UPDATE content_calendar
SET
  step_script_completed = script_checked,
  step_shooting_completed = tournage_checked,
  step_editing_completed = montage_checked,
  step_scheduling_completed = planifie_checked
WHERE step_script_completed != script_checked
   OR step_shooting_completed != tournage_checked
   OR step_editing_completed != montage_checked
   OR step_scheduling_completed != planifie_checked;

-- Step 3: Update determine_content_status to use checkboxes as primary signal
CREATE OR REPLACE FUNCTION determine_content_status(
  p_content_type text,
  p_publication_date date,
  p_date_script date DEFAULT NULL,
  p_date_shooting date DEFAULT NULL,
  p_date_editing date DEFAULT NULL,
  p_date_scheduling date DEFAULT NULL,
  p_script_checked boolean DEFAULT false,
  p_tournage_checked boolean DEFAULT false,
  p_montage_checked boolean DEFAULT false,
  p_planifie_checked boolean DEFAULT false
) RETURNS text AS $$
DECLARE
  v_relevant_steps text[];
BEGIN
  v_relevant_steps := get_relevant_production_steps(p_content_type);
  
  IF p_script_checked 
     AND (NOT ('shooting' = ANY(v_relevant_steps)) OR p_tournage_checked)
     AND (NOT ('editing' = ANY(v_relevant_steps)) OR p_montage_checked)
     AND p_planifie_checked THEN
    IF p_publication_date IS NOT NULL AND p_publication_date <= CURRENT_DATE THEN
      RETURN 'published';
    END IF;
    RETURN 'scheduled';
  END IF;

  IF 'scheduling' = ANY(v_relevant_steps) AND NOT COALESCE(p_planifie_checked, false) THEN
    IF 'editing' = ANY(v_relevant_steps) AND NOT COALESCE(p_montage_checked, false) THEN
      IF 'shooting' = ANY(v_relevant_steps) AND NOT COALESCE(p_tournage_checked, false) THEN
        IF NOT COALESCE(p_script_checked, false) THEN
          RETURN 'script';
        END IF;
        RETURN 'shooting';
      END IF;
      IF NOT COALESCE(p_script_checked, false) THEN
        RETURN 'script';
      END IF;
      RETURN 'editing';
    END IF;
    IF 'shooting' = ANY(v_relevant_steps) AND NOT COALESCE(p_tournage_checked, false) THEN
      IF NOT COALESCE(p_script_checked, false) THEN
        RETURN 'script';
      END IF;
      RETURN 'shooting';
    END IF;
    IF NOT COALESCE(p_script_checked, false) THEN
      RETURN 'script';
    END IF;
    RETURN 'scheduled';
  END IF;

  RETURN 'script';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Keep the checkbox cascade trigger syncing step_*_completed
CREATE OR REPLACE FUNCTION handle_checkbox_cascade() RETURNS trigger AS $$
BEGIN
  NEW.script_checked := COALESCE(NEW.script_checked, false);
  NEW.tournage_checked := COALESCE(NEW.tournage_checked, false);
  NEW.montage_checked := COALESCE(NEW.montage_checked, false);
  NEW.planifie_checked := COALESCE(NEW.planifie_checked, false);

  OLD.script_checked := COALESCE(OLD.script_checked, false);
  OLD.tournage_checked := COALESCE(OLD.tournage_checked, false);
  OLD.montage_checked := COALESCE(OLD.montage_checked, false);
  OLD.planifie_checked := COALESCE(OLD.planifie_checked, false);

  IF NEW.planifie_checked = true AND OLD.planifie_checked = false THEN
    NEW.script_checked := true;
    NEW.tournage_checked := true;
    NEW.montage_checked := true;
  END IF;

  IF (NEW.script_checked = false OR NEW.tournage_checked = false OR NEW.montage_checked = false) 
  AND OLD.planifie_checked = true THEN
    NEW.planifie_checked := false;
  END IF;

  IF NEW.script_checked = false AND OLD.script_checked = true THEN
    NEW.tournage_checked := false;
    NEW.montage_checked := false;
    NEW.planifie_checked := false;
  END IF;

  IF NEW.tournage_checked = false AND OLD.tournage_checked = true THEN
    NEW.montage_checked := false;
    NEW.planifie_checked := false;
  END IF;

  IF NEW.montage_checked = false AND OLD.montage_checked = true THEN
    NEW.planifie_checked := false;
  END IF;

  NEW.step_script_completed := NEW.script_checked;
  NEW.step_shooting_completed := NEW.tournage_checked;
  NEW.step_editing_completed := NEW.montage_checked;
  NEW.step_scheduling_completed := NEW.planifie_checked;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
