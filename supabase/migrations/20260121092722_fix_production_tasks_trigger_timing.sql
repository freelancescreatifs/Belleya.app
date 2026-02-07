/*
  # Corriger le timing du trigger de production_tasks

  1. Problème
    - Le trigger sync_production_tasks est en BEFORE INSERT
    - Il essaie d'insérer dans production_tasks avant que le contenu existe dans content_calendar
    - Cela cause l'erreur: "violates foreign key constraint production_tasks_content_id_fkey"

  2. Solution
    - Changer le trigger en AFTER INSERT pour les nouvelles créations
    - Garder BEFORE UPDATE pour les modifications (pour pouvoir modifier NEW.status)
    - Séparer en deux triggers distincts

  3. Sécurité
    - Les triggers restent sécurisés avec la fonction SECURITY DEFINER
*/

-- Supprimer l'ancien trigger combiné
DROP TRIGGER IF EXISTS trigger_sync_production_tasks ON content_calendar;

-- Créer un trigger AFTER INSERT pour les créations
CREATE TRIGGER trigger_sync_production_tasks_insert
  AFTER INSERT ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();

-- Créer un trigger BEFORE UPDATE pour les modifications
CREATE TRIGGER trigger_sync_production_tasks_update
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();

-- Mettre à jour la fonction pour gérer les deux cas
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
  v_tag text;
  v_production_dates_changed boolean := false;
  v_is_feed_reorder boolean := false;
  v_new_status text;
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
        tags = v_tag,
        production_step = v_step_name,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, tags, production_step, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_time, v_tag, v_step_name, 'todo', 'content', 'medium')
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
        tags = v_tag,
        production_step = v_step_name,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, tags, production_step, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_time, v_tag, v_step_name, 'todo', 'content', 'medium')
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
        tags = v_tag,
        production_step = v_step_name,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, tags, production_step, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_time, v_tag, v_step_name, 'todo', 'content', 'medium')
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
        tags = v_tag,
        production_step = v_step_name,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, end_date, start_date, start_time, tags, production_step, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_date, v_step_time, v_tag, v_step_name, 'todo', 'content', 'medium')
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  -- Déterminer automatiquement le statut du contenu
  v_new_status := determine_content_status(
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_scheduling,
    NEW.publication_date
  );

  -- Pour BEFORE UPDATE, on peut modifier NEW.status
  IF TG_OP = 'UPDATE' THEN
    NEW.status := v_new_status;
    RETURN NEW;
  END IF;

  -- Pour AFTER INSERT, on doit faire un UPDATE séparé
  IF TG_OP = 'INSERT' AND v_new_status != NEW.status THEN
    UPDATE content_calendar
    SET status = v_new_status
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;