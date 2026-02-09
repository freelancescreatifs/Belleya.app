/*
  # Logique complète : Tag "Publié/Non publié" + Checkboxes + Synchronisation

  ## Règles métier STRICTES

  1. TAG "PUBLIÉ" = TAG (pas une étape)
     - Calculé auto : toutes étapes cochées + date passée = Publié
     - Forçage manuel possible

  2. CHECKBOXES = État des étapes (séparées des dates)
     - Synchronisées bidirectionnellement avec les tâches

  3. DATES = Deadlines (NE CHANGENT JAMAIS auto)
     - Servent uniquement au calcul des retards

  4. SYNCHRONISATION
     - Checkbox → Tâche (completed)
     - Tâche → Checkbox (bidirectionnel)
*/

-- ================================================================
-- NETTOYAGE
-- ================================================================

DROP TRIGGER IF EXISTS trigger_auto_calculate_is_published ON content_calendar;
DROP TRIGGER IF EXISTS auto_calculate_published_tag ON content_calendar;
DROP TRIGGER IF EXISTS sync_checkboxes_to_tasks ON content_calendar;
DROP TRIGGER IF EXISTS sync_tasks_to_checkboxes ON tasks;

DROP FUNCTION IF EXISTS calculate_is_published(text, date, date, date, date, date, text);
DROP FUNCTION IF EXISTS auto_calculate_is_published();
DROP FUNCTION IF EXISTS calculate_published_tag CASCADE;
DROP FUNCTION IF EXISTS trigger_calculate_published_tag CASCADE;
DROP FUNCTION IF EXISTS sync_checkbox_to_task CASCADE;
DROP FUNCTION IF EXISTS sync_task_to_checkbox CASCADE;

-- ================================================================
-- COLONNES CHECKBOX
-- ================================================================

ALTER TABLE content_calendar
ADD COLUMN IF NOT EXISTS step_script_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS step_shooting_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS step_editing_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS step_scheduling_completed boolean DEFAULT false;

-- ================================================================
-- MIGRATION DONNÉES
-- ================================================================

UPDATE content_calendar
SET
  step_script_completed = (date_script IS NOT NULL),
  step_shooting_completed = (date_shooting IS NOT NULL),
  step_editing_completed = (date_editing IS NOT NULL),
  step_scheduling_completed = (date_scheduling IS NOT NULL)
WHERE user_id IS NOT NULL;

-- ================================================================
-- FONCTIONS HELPER
-- ================================================================

CREATE OR REPLACE FUNCTION get_relevant_production_steps(p_content_type text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_content_type
    WHEN 'story' THEN ARRAY['script', 'shooting', 'scheduling']
    WHEN 'post' THEN ARRAY['script', 'scheduling']
    ELSE ARRAY['script', 'shooting', 'editing', 'scheduling']
  END;
END;
$$;

-- ================================================================
-- CALCUL TAG "PUBLIÉ"
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_published_tag(
  p_content_id uuid,
  p_content_type text,
  p_publication_date date,
  p_publication_time text,
  p_step_script_completed boolean,
  p_step_shooting_completed boolean,
  p_step_editing_completed boolean,
  p_step_scheduling_completed boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_relevant_steps text[];
  v_publication_datetime timestamp;
  v_publication_time_value time;
  v_now timestamp;
  v_all_steps_completed boolean;
BEGIN
  v_relevant_steps := get_relevant_production_steps(p_content_type);
  v_all_steps_completed := true;

  IF 'script' = ANY(v_relevant_steps) AND NOT COALESCE(p_step_script_completed, false) THEN
    v_all_steps_completed := false;
  END IF;

  IF 'shooting' = ANY(v_relevant_steps) AND NOT COALESCE(p_step_shooting_completed, false) THEN
    v_all_steps_completed := false;
  END IF;

  IF 'editing' = ANY(v_relevant_steps) AND NOT COALESCE(p_step_editing_completed, false) THEN
    v_all_steps_completed := false;
  END IF;

  IF 'scheduling' = ANY(v_relevant_steps) AND NOT COALESCE(p_step_scheduling_completed, false) THEN
    v_all_steps_completed := false;
  END IF;

  IF NOT v_all_steps_completed THEN
    RETURN false;
  END IF;

  BEGIN
    v_publication_time_value := COALESCE(p_publication_time::time, '00:00:00'::time);
  EXCEPTION
    WHEN OTHERS THEN
      v_publication_time_value := '00:00:00'::time;
  END;

  v_publication_datetime := (p_publication_date || ' ' || v_publication_time_value::text)::timestamp;
  v_now := now();

  RETURN v_publication_datetime <= v_now;
END;
$$;

-- ================================================================
-- TRIGGER AUTO-CALCUL TAG
-- ================================================================

CREATE OR REPLACE FUNCTION trigger_calculate_published_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_published boolean;
BEGIN
  IF current_setting('app.in_force_published', true) = 'true' THEN
    RETURN NEW;
  END IF;

  v_is_published := calculate_published_tag(
    NEW.id, NEW.content_type, NEW.publication_date, NEW.publication_time,
    NEW.step_script_completed, NEW.step_shooting_completed,
    NEW.step_editing_completed, NEW.step_scheduling_completed
  );

  NEW.is_published := v_is_published;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_calculate_published_tag
  BEFORE INSERT OR UPDATE OF
    content_type, publication_date, publication_time,
    step_script_completed, step_shooting_completed,
    step_editing_completed, step_scheduling_completed
  ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_published_tag();

-- ================================================================
-- SYNC CHECKBOX → TÂCHE
-- ================================================================

CREATE OR REPLACE FUNCTION sync_checkbox_to_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_id uuid;
  v_steps_to_sync record;
BEGIN
  IF current_setting('app.in_step_sync', true) = 'true' THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('app.in_step_sync', 'true', true);

  BEGIN
    FOR v_steps_to_sync IN
      SELECT
        'script' as step_name, NEW.step_script_completed as is_completed,
        (NEW.step_script_completed IS DISTINCT FROM OLD.step_script_completed) as has_changed
      UNION ALL
      SELECT 'shooting', NEW.step_shooting_completed,
        (NEW.step_shooting_completed IS DISTINCT FROM OLD.step_shooting_completed)
      UNION ALL
      SELECT 'editing', NEW.step_editing_completed,
        (NEW.step_editing_completed IS DISTINCT FROM OLD.step_editing_completed)
      UNION ALL
      SELECT 'scheduling', NEW.step_scheduling_completed,
        (NEW.step_scheduling_completed IS DISTINCT FROM OLD.step_scheduling_completed)
    LOOP
      IF v_steps_to_sync.has_changed THEN
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = NEW.id AND pt.production_step = v_steps_to_sync.step_name;

        IF v_task_id IS NOT NULL THEN
          UPDATE tasks
          SET
            completed = v_steps_to_sync.is_completed,
            completed_at = CASE WHEN v_steps_to_sync.is_completed THEN now() ELSE NULL END,
            last_completed_date = CASE WHEN v_steps_to_sync.is_completed THEN CURRENT_DATE ELSE NULL END,
            status = CASE WHEN v_steps_to_sync.is_completed THEN 'completed' ELSE 'todo' END
          WHERE id = v_task_id;
        END IF;
      END IF;
    END LOOP;

    PERFORM set_config('app.in_step_sync', 'false', true);
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM set_config('app.in_step_sync', 'false', true);
      RAISE;
  END;
END;
$$;

CREATE TRIGGER sync_checkboxes_to_tasks
  AFTER UPDATE OF
    step_script_completed, step_shooting_completed,
    step_editing_completed, step_scheduling_completed
  ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_checkbox_to_task();

-- ================================================================
-- SYNC TÂCHE → CHECKBOX
-- ================================================================

CREATE OR REPLACE FUNCTION sync_task_to_checkbox()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id uuid;
  v_production_step text;
  v_column_name text;
BEGIN
  IF current_setting('app.in_step_sync', true) = 'true' THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('app.in_step_sync', 'true', true);

  BEGIN
    SELECT pt.content_id, pt.production_step
    INTO v_content_id, v_production_step
    FROM production_tasks pt
    WHERE pt.task_id = NEW.id;

    IF v_content_id IS NOT NULL THEN
      v_column_name := 'step_' || v_production_step || '_completed';
      EXECUTE format('UPDATE content_calendar SET %I = $1 WHERE id = $2', v_column_name)
      USING NEW.completed, v_content_id;
    END IF;

    PERFORM set_config('app.in_step_sync', 'false', true);
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM set_config('app.in_step_sync', 'false', true);
      RAISE;
  END;
END;
$$;

CREATE TRIGGER sync_tasks_to_checkboxes
  AFTER UPDATE OF completed ON tasks
  FOR EACH ROW
  WHEN (NEW.completed IS DISTINCT FROM OLD.completed)
  EXECUTE FUNCTION sync_task_to_checkbox();

-- ================================================================
-- FORÇAGE MANUEL "PUBLIÉ"
-- ================================================================

CREATE OR REPLACE FUNCTION force_publish_content(p_content_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_type text;
  v_relevant_steps text[];
  v_step_name text;
  v_task_id uuid;
  v_affected_tasks int := 0;
BEGIN
  PERFORM set_config('app.in_force_published', 'true', true);
  PERFORM set_config('app.in_step_sync', 'true', true);

  BEGIN
    SELECT content_type INTO v_content_type
    FROM content_calendar WHERE id = p_content_id;

    IF NOT FOUND THEN
      PERFORM set_config('app.in_force_published', 'false', true);
      PERFORM set_config('app.in_step_sync', 'false', true);
      RAISE EXCEPTION 'Content not found';
    END IF;

    v_relevant_steps := get_relevant_production_steps(v_content_type);

    UPDATE content_calendar
    SET
      step_script_completed = ('script' = ANY(v_relevant_steps)),
      step_shooting_completed = ('shooting' = ANY(v_relevant_steps)),
      step_editing_completed = ('editing' = ANY(v_relevant_steps)),
      step_scheduling_completed = ('scheduling' = ANY(v_relevant_steps)),
      is_published = true
    WHERE id = p_content_id;

    FOREACH v_step_name IN ARRAY v_relevant_steps
    LOOP
      SELECT pt.task_id INTO v_task_id
      FROM production_tasks pt
      WHERE pt.content_id = p_content_id AND pt.production_step = v_step_name;

      IF v_task_id IS NOT NULL THEN
        UPDATE tasks
        SET completed = true, completed_at = now(),
            last_completed_date = CURRENT_DATE, status = 'completed'
        WHERE id = v_task_id;
        v_affected_tasks := v_affected_tasks + 1;
      END IF;
    END LOOP;

    PERFORM set_config('app.in_force_published', 'false', true);
    PERFORM set_config('app.in_step_sync', 'false', true);

    RETURN jsonb_build_object(
      'success', true,
      'content_id', p_content_id,
      'steps_completed', v_relevant_steps,
      'tasks_completed', v_affected_tasks
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM set_config('app.in_force_published', 'false', true);
      PERFORM set_config('app.in_step_sync', 'false', true);
      RAISE;
  END;
END;
$$;

-- ================================================================
-- DÉTECTION RETARDS
-- ================================================================

CREATE OR REPLACE FUNCTION get_production_delays(p_content_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_content record;
  v_delays jsonb := '[]'::jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  SELECT
    content_type,
    date_script, step_script_completed,
    date_shooting, step_shooting_completed,
    date_editing, step_editing_completed,
    date_scheduling, step_scheduling_completed,
    publication_date
  INTO v_content
  FROM content_calendar WHERE id = p_content_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Content not found');
  END IF;

  IF v_content.date_script IS NOT NULL
     AND NOT COALESCE(v_content.step_script_completed, false)
     AND v_content.date_script < v_today THEN
    v_delays := v_delays || jsonb_build_object(
      'step', 'script', 'label', 'Script',
      'deadline', v_content.date_script,
      'days_late', v_today - v_content.date_script
    );
  END IF;

  IF v_content.date_shooting IS NOT NULL
     AND NOT COALESCE(v_content.step_shooting_completed, false)
     AND v_content.date_shooting < v_today THEN
    v_delays := v_delays || jsonb_build_object(
      'step', 'shooting', 'label', 'Tournage',
      'deadline', v_content.date_shooting,
      'days_late', v_today - v_content.date_shooting
    );
  END IF;

  IF v_content.date_editing IS NOT NULL
     AND NOT COALESCE(v_content.step_editing_completed, false)
     AND v_content.date_editing < v_today THEN
    v_delays := v_delays || jsonb_build_object(
      'step', 'editing', 'label', 'Montage',
      'deadline', v_content.date_editing,
      'days_late', v_today - v_content.date_editing
    );
  END IF;

  IF v_content.date_scheduling IS NOT NULL
     AND NOT COALESCE(v_content.step_scheduling_completed, false)
     AND v_content.date_scheduling < v_today THEN
    v_delays := v_delays || jsonb_build_object(
      'step', 'scheduling', 'label', 'Programmation',
      'deadline', v_content.date_scheduling,
      'days_late', v_today - v_content.date_scheduling
    );
  END IF;

  RETURN jsonb_build_object(
    'content_id', p_content_id,
    'has_delays', jsonb_array_length(v_delays) > 0,
    'delays', v_delays
  );
END;
$$;

-- ================================================================
-- INITIALISATION
-- ================================================================

UPDATE content_calendar
SET is_published = calculate_published_tag(
  id, content_type, publication_date, publication_time,
  step_script_completed, step_shooting_completed,
  step_editing_completed, step_scheduling_completed
)
WHERE user_id IS NOT NULL;

UPDATE tasks t
SET
  completed = CASE pt.production_step
    WHEN 'script' THEN c.step_script_completed
    WHEN 'shooting' THEN c.step_shooting_completed
    WHEN 'editing' THEN c.step_editing_completed
    WHEN 'scheduling' THEN c.step_scheduling_completed
    ELSE false
  END,
  status = CASE
    WHEN (CASE pt.production_step
      WHEN 'script' THEN c.step_script_completed
      WHEN 'shooting' THEN c.step_shooting_completed
      WHEN 'editing' THEN c.step_editing_completed
      WHEN 'scheduling' THEN c.step_scheduling_completed
      ELSE false
    END) THEN 'completed' ELSE 'todo'
  END
FROM production_tasks pt
JOIN content_calendar c ON c.id = pt.content_id
WHERE t.id = pt.task_id;