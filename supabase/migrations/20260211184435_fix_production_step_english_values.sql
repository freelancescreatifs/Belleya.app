/*
  # Fix Production Step Values - Use English Names
  
  ## Problem
  The function `auto_generate_production_tasks()` uses French production step names:
  - 'tournage', 'montage', 'planification'
  
  But the CHECK constraint requires English names:
  - 'shooting', 'editing', 'scheduling'
  
  This causes the error:
  "new row for relation tasks violates check constraint tasks_production_step_check"
  
  ## Solution
  Update the function to use the correct English values matching the constraint.
  
  ## Mapping
  - script → script ✅
  - tournage → shooting ✅
  - montage → editing ✅
  - planification → scheduling ✅
*/

CREATE OR REPLACE FUNCTION auto_generate_production_tasks()
RETURNS TRIGGER AS $$
DECLARE
  step_date date;
  step_time time;
  step_name text;
  task_title text;
  task_exists boolean;
  task_scheduled_at timestamptz;
BEGIN
  -- Only process if this is an INSERT or if production dates changed
  IF TG_OP = 'UPDATE' THEN
    -- Check if production dates actually changed
    IF OLD.date_script IS NOT DISTINCT FROM NEW.date_script
       AND OLD.date_shooting IS NOT DISTINCT FROM NEW.date_shooting
       AND OLD.date_editing IS NOT DISTINCT FROM NEW.date_editing
       AND OLD.date_scheduling IS NOT DISTINCT FROM NEW.date_scheduling THEN
      RETURN NEW;
    END IF;
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- Process Script task
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_script IS NOT NULL THEN
    -- Check if task already exists
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'script'
    ) INTO task_exists;

    IF NOT task_exists THEN
      task_scheduled_at := (NEW.date_script || ' ' || COALESCE(NULLIF(NEW.date_script_time, ''), '09:00:00'))::timestamptz;

      -- Create task
      INSERT INTO tasks (
        user_id,
        company_id,
        content_id,
        production_step,
        title,
        description,
        category,
        priority,
        scheduled_at,
        start_date,
        start_time,
        completed,
        tags
      ) VALUES (
        NEW.user_id,
        NEW.company_id,
        NEW.id,
        'script', -- ✅ English value
        'Script - ' || LEFT(NEW.title, 50),
        'Rédiger le script pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_script,
        COALESCE(NULLIF(NEW.date_script_time, ''), '09:00:00')::time,
        COALESCE(NEW.script_checked, false),
        ARRAY['Script', 'Production']
      );
    ELSE
      -- Update existing task
      UPDATE tasks
      SET
        scheduled_at = (NEW.date_script || ' ' || COALESCE(NULLIF(NEW.date_script_time, ''), '09:00:00'))::timestamptz,
        start_date = NEW.date_script,
        start_time = COALESCE(NULLIF(NEW.date_script_time, ''), '09:00:00')::time,
        completed = COALESCE(NEW.script_checked, false)
      WHERE content_id = NEW.id AND production_step = 'script';
    END IF;
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- Process Shooting task (Tournage)
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_shooting IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'shooting' -- ✅ Changed from 'tournage'
    ) INTO task_exists;

    IF NOT task_exists THEN
      task_scheduled_at := (NEW.date_shooting || ' ' || COALESCE(NULLIF(NEW.date_shooting_time, ''), '10:00:00'))::timestamptz;

      INSERT INTO tasks (
        user_id,
        company_id,
        content_id,
        production_step,
        title,
        description,
        category,
        priority,
        scheduled_at,
        start_date,
        start_time,
        completed,
        tags
      ) VALUES (
        NEW.user_id,
        NEW.company_id,
        NEW.id,
        'shooting', -- ✅ English value
        'Tournage - ' || LEFT(NEW.title, 50),
        'Filmer le contenu pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_shooting,
        COALESCE(NULLIF(NEW.date_shooting_time, ''), '10:00:00')::time,
        COALESCE(NEW.tournage_checked, false),
        ARRAY['Tournage', 'Production']
      );
    ELSE
      UPDATE tasks
      SET
        scheduled_at = (NEW.date_shooting || ' ' || COALESCE(NULLIF(NEW.date_shooting_time, ''), '10:00:00'))::timestamptz,
        start_date = NEW.date_shooting,
        start_time = COALESCE(NULLIF(NEW.date_shooting_time, ''), '10:00:00')::time,
        completed = COALESCE(NEW.tournage_checked, false)
      WHERE content_id = NEW.id AND production_step = 'shooting'; -- ✅ Changed from 'tournage'
    END IF;
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- Process Editing task (Montage)
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_editing IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'editing' -- ✅ Changed from 'montage'
    ) INTO task_exists;

    IF NOT task_exists THEN
      task_scheduled_at := (NEW.date_editing || ' ' || COALESCE(NULLIF(NEW.date_editing_time, ''), '14:00:00'))::timestamptz;

      INSERT INTO tasks (
        user_id,
        company_id,
        content_id,
        production_step,
        title,
        description,
        category,
        priority,
        scheduled_at,
        start_date,
        start_time,
        completed,
        tags
      ) VALUES (
        NEW.user_id,
        NEW.company_id,
        NEW.id,
        'editing', -- ✅ English value
        'Montage - ' || LEFT(NEW.title, 50),
        'Monter le contenu pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_editing,
        COALESCE(NULLIF(NEW.date_editing_time, ''), '14:00:00')::time,
        COALESCE(NEW.montage_checked, false),
        ARRAY['Montage', 'Production']
      );
    ELSE
      UPDATE tasks
      SET
        scheduled_at = (NEW.date_editing || ' ' || COALESCE(NULLIF(NEW.date_editing_time, ''), '14:00:00'))::timestamptz,
        start_date = NEW.date_editing,
        start_time = COALESCE(NULLIF(NEW.date_editing_time, ''), '14:00:00')::time,
        completed = COALESCE(NEW.montage_checked, false)
      WHERE content_id = NEW.id AND production_step = 'editing'; -- ✅ Changed from 'montage'
    END IF;
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- Process Scheduling task (Planification)
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_scheduling IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'scheduling' -- ✅ Changed from 'planification'
    ) INTO task_exists;

    IF NOT task_exists THEN
      task_scheduled_at := (NEW.date_scheduling || ' ' || COALESCE(NULLIF(NEW.date_scheduling_time, ''), '16:00:00'))::timestamptz;

      INSERT INTO tasks (
        user_id,
        company_id,
        content_id,
        production_step,
        title,
        description,
        category,
        priority,
        scheduled_at,
        start_date,
        start_time,
        completed,
        tags
      ) VALUES (
        NEW.user_id,
        NEW.company_id,
        NEW.id,
        'scheduling', -- ✅ English value
        'Planification - ' || LEFT(NEW.title, 50),
        'Programmer le contenu pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_scheduling,
        COALESCE(NULLIF(NEW.date_scheduling_time, ''), '16:00:00')::time,
        COALESCE(NEW.planifie_checked, false),
        ARRAY['Planification', 'Production']
      );
    ELSE
      UPDATE tasks
      SET
        scheduled_at = (NEW.date_scheduling || ' ' || COALESCE(NULLIF(NEW.date_scheduling_time, ''), '16:00:00'))::timestamptz,
        start_date = NEW.date_scheduling,
        start_time = COALESCE(NULLIF(NEW.date_scheduling_time, ''), '16:00:00')::time,
        completed = COALESCE(NEW.planifie_checked, false)
      WHERE content_id = NEW.id AND production_step = 'scheduling'; -- ✅ Changed from 'planification'
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_generate_production_tasks() TO authenticated;
