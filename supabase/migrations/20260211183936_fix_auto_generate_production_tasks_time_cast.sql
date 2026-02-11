/*
  # Fix Time Cast in auto_generate_production_tasks Function
  
  ## Problem
  The function `auto_generate_production_tasks()` tries to insert empty strings "" 
  into TIME columns (start_time), causing PostgreSQL cast errors:
  "column start_time is of type time without time zone but expression is of type text"
  
  ## Root Cause
  Using COALESCE(NEW.date_script_time, '09:00:00') doesn't handle empty strings.
  If the value is "", COALESCE returns "" instead of the default.
  
  ## Solution
  Use NULLIF to convert empty strings to NULL before casting:
  COALESCE(NULLIF(NEW.date_script_time, ''), '09:00:00')::time
  
  This ensures:
  - Empty string "" → NULL → default time value
  - Valid time "14:30" → time value (with :00 added by frontend)
  - NULL → NULL → default time value
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
      -- ✅ FIX: Use NULLIF to convert empty string to NULL before casting
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
        'script',
        'Script - ' || LEFT(NEW.title, 50),
        'Rédiger le script pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_script,
        -- ✅ FIX: Use NULLIF + explicit cast
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
  -- Process Tournage task
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_shooting IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'tournage'
    ) INTO task_exists;

    IF NOT task_exists THEN
      -- ✅ FIX: Use NULLIF to convert empty string to NULL before casting
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
        'tournage',
        'Tournage - ' || LEFT(NEW.title, 50),
        'Filmer le contenu pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_shooting,
        -- ✅ FIX: Use NULLIF + explicit cast
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
      WHERE content_id = NEW.id AND production_step = 'tournage';
    END IF;
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- Process Montage task
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_editing IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'montage'
    ) INTO task_exists;

    IF NOT task_exists THEN
      -- ✅ FIX: Use NULLIF to convert empty string to NULL before casting
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
        'montage',
        'Montage - ' || LEFT(NEW.title, 50),
        'Monter le contenu pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_editing,
        -- ✅ FIX: Use NULLIF + explicit cast
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
      WHERE content_id = NEW.id AND production_step = 'montage';
    END IF;
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- Process Planification task
  -- ════════════════════════════════════════════════════════════════
  IF NEW.date_scheduling IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM tasks
      WHERE content_id = NEW.id AND production_step = 'planification'
    ) INTO task_exists;

    IF NOT task_exists THEN
      -- ✅ FIX: Use NULLIF to convert empty string to NULL before casting
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
        'planification',
        'Planification - ' || LEFT(NEW.title, 50),
        'Programmer le contenu pour: ' || NEW.title,
        'content',
        'high',
        task_scheduled_at,
        NEW.date_scheduling,
        -- ✅ FIX: Use NULLIF + explicit cast
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
      WHERE content_id = NEW.id AND production_step = 'planification';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_generate_production_tasks() TO authenticated;
