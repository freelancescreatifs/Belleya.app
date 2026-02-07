/*
  # Fix date_subtitles trigger error

  1. Problème
    - Le trigger sync_production_tasks() fait référence à date_subtitles qui n'existe plus
    - Provoque une erreur lors de la création de contenu

  2. Solution
    - Recréer complètement le trigger sans référence à date_subtitles
    - Mettre à jour la fonction determine_content_status
*/

-- Supprimer les anciens triggers et fonctions avec CASCADE
DROP TRIGGER IF EXISTS sync_production_tasks_trigger ON content_calendar;
DROP TRIGGER IF EXISTS trigger_sync_production_tasks ON content_calendar;
DROP FUNCTION IF EXISTS sync_production_tasks() CASCADE;
DROP FUNCTION IF EXISTS determine_content_status(date, date, date, date, date, date, date) CASCADE;
DROP FUNCTION IF EXISTS determine_content_status(date, date, date, date, date) CASCADE;

-- Recréer la fonction determine_content_status sans date_subtitles
CREATE OR REPLACE FUNCTION determine_content_status(
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date,
  p_publication_date date
)
RETURNS text AS $$
BEGIN
  IF p_publication_date IS NOT NULL AND p_publication_date <= CURRENT_DATE THEN
    RETURN 'published';
  ELSIF p_date_scheduling IS NOT NULL THEN
    RETURN 'scheduled';
  ELSIF p_date_editing IS NOT NULL THEN
    RETURN 'editing';
  ELSIF p_date_shooting IS NOT NULL THEN
    RETURN 'shooting';
  ELSIF p_date_script IS NOT NULL THEN
    RETURN 'script';
  ELSE
    RETURN 'idea';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recréer le trigger sans les références à date_subtitles
CREATE OR REPLACE FUNCTION sync_production_tasks()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_task_id uuid;
  v_existing_task_id uuid;
  v_step_name text;
  v_step_label text;
  v_step_date date;
  v_step_start_time time;
  v_step_end_time time;
  v_priority text;
  v_social_media_tag text := 'Réseaux sociaux';
BEGIN
  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

  -- Écriture (Script)
  BEGIN
    v_step_name := 'script';
    v_step_label := 'Écriture - ' || NEW.title;
    v_step_date := NEW.date_script;
    v_step_start_time := COALESCE(NEW.date_script_time::time, '09:00'::time);
    v_step_end_time := COALESCE(NEW.date_script_end_time::time, '17:00'::time);

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          end_date = v_step_date,
          start_date = v_step_date,
          start_time = v_step_start_time,
          end_time = v_step_end_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, end_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_start_time, v_step_end_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Écriture pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Tournage (Shooting)
  BEGIN
    v_step_name := 'shooting';
    v_step_label := 'Tournage - ' || NEW.title;
    v_step_date := NEW.date_shooting;
    v_step_start_time := COALESCE(NEW.date_shooting_time::time, '09:00'::time);
    v_step_end_time := COALESCE(NEW.date_shooting_end_time::time, '17:00'::time);

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          end_date = v_step_date,
          start_date = v_step_date,
          start_time = v_step_start_time,
          end_time = v_step_end_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, end_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_start_time, v_step_end_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Tournage pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Montage (Editing)
  BEGIN
    v_step_name := 'editing';
    v_step_label := 'Montage - ' || NEW.title;
    v_step_date := NEW.date_editing;
    v_step_start_time := COALESCE(NEW.date_editing_time::time, '09:00'::time);
    v_step_end_time := COALESCE(NEW.date_editing_end_time::time, '17:00'::time);

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          end_date = v_step_date,
          start_date = v_step_date,
          start_time = v_step_start_time,
          end_time = v_step_end_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, end_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_start_time, v_step_end_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Montage pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Programmation (Scheduling)
  BEGIN
    v_step_name := 'scheduling';
    v_step_label := 'Programmation - ' || NEW.title;
    v_step_date := NEW.date_scheduling;
    v_step_start_time := COALESCE(NEW.date_scheduling_time::time, '09:00'::time);
    v_step_end_time := COALESCE(NEW.date_scheduling_end_time::time, '17:00'::time);

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          end_date = v_step_date,
          start_date = v_step_date,
          start_time = v_step_start_time,
          end_time = v_step_end_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, end_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_start_time, v_step_end_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Programmation pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Déterminer automatiquement le statut du contenu (sans sous-titres ni validation)
  NEW.status := determine_content_status(
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_scheduling,
    NEW.publication_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER sync_production_tasks_trigger
  BEFORE INSERT OR UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();
