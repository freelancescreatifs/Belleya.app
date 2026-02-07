/*
  # Correction complète de la synchronisation des étapes de production

  1. Problèmes identifiés
    - La fonction sync_production_tasks() utilise due_date et due_time qui n'existent pas
    - Les colonnes correctes sont : start_date, end_date, start_time, end_time
    - Les tâches de production doivent avoir une durée de 1 heure par défaut
    - La synchronisation bidirectionnelle doit fonctionner correctement

  2. Solutions
    - Corriger sync_production_tasks() pour utiliser les bonnes colonnes
    - Ajouter duration_minutes = 60 pour toutes les tâches de production
    - S'assurer que production_step est correctement défini
    - Améliorer la synchronisation inverse (task → content)

  3. Synchronisation complète
    - Content → Tasks : quand on modifie les dates de production dans le contenu
    - Tasks → Content : quand on coche/décoche une tâche de production
    - Statuts synchronisés automatiquement partout
*/

-- Recréer complètement la fonction sync_production_tasks avec les bonnes colonnes
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
  v_step_time time;
  v_step_end_time time;
  v_tag text;
  v_production_dates_changed boolean := false;
  v_is_feed_reorder boolean := false;
BEGIN
  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

  -- Vérifier si c'est juste un réordonnancement du feed (pas de changement de dates de production)
  IF TG_OP = 'UPDATE' THEN
    v_production_dates_changed := (
      OLD.date_script IS DISTINCT FROM NEW.date_script OR
      OLD.date_shooting IS DISTINCT FROM NEW.date_shooting OR
      OLD.date_editing IS DISTINCT FROM NEW.date_editing OR
      OLD.date_scheduling IS DISTINCT FROM NEW.date_scheduling
    );

    v_is_feed_reorder := (
      NOT v_production_dates_changed AND
      (
        OLD.feed_order IS DISTINCT FROM NEW.feed_order OR
        OLD.publication_date IS DISTINCT FROM NEW.publication_date OR
        OLD.publication_time IS DISTINCT FROM NEW.publication_time
      )
    );

    -- Si c'est juste un réordonnancement, ne pas toucher aux tâches
    IF v_is_feed_reorder THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Écriture (Script)
  v_step_name := 'script';
  v_step_label := 'Écriture - ' || NEW.title;
  v_step_date := NEW.date_script;
  v_step_time := COALESCE(NEW.date_script_time::time, '09:00'::time);
  v_step_end_time := COALESCE(NEW.date_script_end_time::time, (v_step_time + interval '1 hour')::time);
  v_tag := 'content:' || NEW.id::text;

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        end_date = v_step_date,
        start_date = v_step_date,
        start_time = v_step_time,
        end_time = v_step_end_time,
        duration_minutes = 60,
        tags = v_tag,
        production_step = v_step_name,
        show_in_calendar = true,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (
        user_id, company_id, title, description, 
        end_date, start_date, start_time, end_time, duration_minutes,
        tags, production_step, status, category, priority, show_in_calendar
      )
      VALUES (
        v_user_id, v_company_id, v_step_label, 
        'Tâche générée automatiquement pour le contenu: ' || NEW.title, 
        v_step_date, v_step_date, v_step_time, v_step_end_time, 60,
        v_tag, v_step_name, 'todo', 'content', 'medium', true
      )
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  -- Tournage (Shooting)
  v_step_name := 'shooting';
  v_step_label := 'Tournage - ' || NEW.title;
  v_step_date := NEW.date_shooting;
  v_step_time := COALESCE(NEW.date_shooting_time::time, '09:00'::time);
  v_step_end_time := COALESCE(NEW.date_shooting_end_time::time, (v_step_time + interval '1 hour')::time);

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        end_date = v_step_date,
        start_date = v_step_date,
        start_time = v_step_time,
        end_time = v_step_end_time,
        duration_minutes = 60,
        tags = v_tag,
        production_step = v_step_name,
        show_in_calendar = true,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (
        user_id, company_id, title, description, 
        end_date, start_date, start_time, end_time, duration_minutes,
        tags, production_step, status, category, priority, show_in_calendar
      )
      VALUES (
        v_user_id, v_company_id, v_step_label, 
        'Tâche générée automatiquement pour le contenu: ' || NEW.title, 
        v_step_date, v_step_date, v_step_time, v_step_end_time, 60,
        v_tag, v_step_name, 'todo', 'content', 'medium', true
      )
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  -- Montage (Editing)
  v_step_name := 'editing';
  v_step_label := 'Montage - ' || NEW.title;
  v_step_date := NEW.date_editing;
  v_step_time := COALESCE(NEW.date_editing_time::time, '09:00'::time);
  v_step_end_time := COALESCE(NEW.date_editing_end_time::time, (v_step_time + interval '1 hour')::time);

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        end_date = v_step_date,
        start_date = v_step_date,
        start_time = v_step_time,
        end_time = v_step_end_time,
        duration_minutes = 60,
        tags = v_tag,
        production_step = v_step_name,
        show_in_calendar = true,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (
        user_id, company_id, title, description, 
        end_date, start_date, start_time, end_time, duration_minutes,
        tags, production_step, status, category, priority, show_in_calendar
      )
      VALUES (
        v_user_id, v_company_id, v_step_label, 
        'Tâche générée automatiquement pour le contenu: ' || NEW.title, 
        v_step_date, v_step_date, v_step_time, v_step_end_time, 60,
        v_tag, v_step_name, 'todo', 'content', 'medium', true
      )
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  -- Programmation (Scheduling)
  v_step_name := 'scheduling';
  v_step_label := 'Programmation - ' || NEW.title;
  v_step_date := NEW.date_scheduling;
  v_step_time := COALESCE(NEW.date_scheduling_time::time, '09:00'::time);
  v_step_end_time := COALESCE(NEW.date_scheduling_end_time::time, (v_step_time + interval '1 hour')::time);

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        end_date = v_step_date,
        start_date = v_step_date,
        start_time = v_step_time,
        end_time = v_step_end_time,
        duration_minutes = 60,
        tags = v_tag,
        production_step = v_step_name,
        show_in_calendar = true,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (
        user_id, company_id, title, description, 
        end_date, start_date, start_time, end_time, duration_minutes,
        tags, production_step, status, category, priority, show_in_calendar
      )
      VALUES (
        v_user_id, v_company_id, v_step_label, 
        'Tâche générée automatiquement pour le contenu: ' || NEW.title, 
        v_step_date, v_step_date, v_step_time, v_step_end_time, 60,
        v_tag, v_step_name, 'todo', 'content', 'medium', true
      )
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  -- Déterminer automatiquement le statut du contenu
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

-- Vérifier que le trigger existe et utilise la bonne fonction
DROP TRIGGER IF EXISTS trigger_sync_production_tasks ON content_calendar;

CREATE TRIGGER trigger_sync_production_tasks
  BEFORE INSERT OR UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();

-- Améliorer la synchronisation inverse (tasks → content)
-- pour que les statuts se mettent à jour correctement
CREATE OR REPLACE FUNCTION update_content_dates_from_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id uuid;
  v_date_column text;
  v_new_date date;
BEGIN
  -- Vérifier si c'est une tâche de production liée à un contenu
  v_content_id := NULL;
  IF NEW.production_step IS NOT NULL AND NEW.tags IS NOT NULL AND NEW.tags LIKE 'content:%' THEN
    v_content_id := substring(NEW.tags from 'content:([a-f0-9-]+)')::uuid;
  END IF;

  -- Si ce n'est PAS une tâche de production avec content_id, on laisse passer
  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Déterminer la colonne de date à mettre à jour
  v_date_column := 'date_' || NEW.production_step;

  -- Si la tâche est cochée, mettre à jour la date avec la date de la tâche
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Utiliser la date de la tâche (end_date ou start_date)
    v_new_date := COALESCE(NEW.end_date, NEW.start_date, CURRENT_DATE);

    -- Mise à jour dynamique de la date de production
    EXECUTE format('
      UPDATE content_calendar
      SET %I = $1,
          updated_at = now()
      WHERE id = $2
    ', v_date_column)
    USING v_new_date, v_content_id;
  END IF;

  -- Si la tâche est décochée, supprimer la date de production
  IF NEW.completed = false AND OLD.completed = true THEN
    -- Mise à jour dynamique pour mettre la date à NULL
    EXECUTE format('
      UPDATE content_calendar
      SET %I = NULL,
          updated_at = now()
      WHERE id = $1
    ', v_date_column)
    USING v_content_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger pour la synchronisation inverse
DROP TRIGGER IF EXISTS trigger_update_content_dates_from_task ON tasks;

CREATE TRIGGER trigger_update_content_dates_from_task
  AFTER UPDATE OF completed ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_content_dates_from_task();

-- Mettre à jour les tâches de production existantes pour ajouter duration_minutes = 60
UPDATE tasks
SET 
  duration_minutes = 60,
  show_in_calendar = true
WHERE production_step IS NOT NULL
  AND (duration_minutes IS NULL OR duration_minutes = 0);
