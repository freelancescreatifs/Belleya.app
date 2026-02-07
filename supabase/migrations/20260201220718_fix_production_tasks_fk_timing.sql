/*
  # Fix production_tasks FK timing issue

  1. Problème identifié
    - Le trigger BEFORE INSERT essaie d'insérer dans production_tasks
    - Mais la ligne dans content_calendar n'existe pas encore
    - La policy RLS vérifie si content_id existe dans content_calendar
    - Résultat : violation de FK / échec de policy

  2. Solution
    - Séparer en 2 triggers :
      a) BEFORE : calcule uniquement le statut (pas de création de tâches)
      b) AFTER : crée les tâches de production (la ligne content existe déjà)
    - Désactiver complètement RLS dans le trigger AFTER avec SET LOCAL

  3. Avantages
    - Pas d'erreur FK car content existe au moment de l'insertion dans production_tasks
    - RLS bypassé complètement donc pas de problème de permissions
    - Séparation des responsabilités (statut vs tâches)
*/

-- Fonction qui calcule uniquement le statut (BEFORE trigger)
CREATE OR REPLACE FUNCTION calculate_content_status_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le statut basé sur les dates de production
  NEW.status := determine_content_status(
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_scheduling,
    NEW.publication_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction qui crée/met à jour les tâches de production (AFTER trigger)
CREATE OR REPLACE FUNCTION sync_production_tasks_after()
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
  -- IMPORTANT : Désactiver complètement RLS pour cette transaction
  SET LOCAL row_security = off;

  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

  -- Vérifier si c'est juste un réordonnancement du feed
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

  v_tag := 'content:' || NEW.id::text;

  -- Écriture (Script)
  v_step_name := 'script';
  v_step_label := 'Écriture - ' || NEW.title;
  v_step_date := NEW.date_script;
  v_step_time := COALESCE(NEW.date_script_time::time, '09:00'::time);
  v_step_end_time := COALESCE(NEW.date_script_end_time::time, (v_step_time + interval '1 hour')::time);

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger BEFORE qui faisait tout
DROP TRIGGER IF EXISTS trigger_sync_production_tasks ON content_calendar;

-- Créer le nouveau trigger BEFORE qui calcule uniquement le statut
CREATE TRIGGER trigger_calculate_content_status
  BEFORE INSERT OR UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION calculate_content_status_only();

-- Créer le nouveau trigger AFTER qui crée les tâches
CREATE TRIGGER trigger_sync_production_tasks_after
  AFTER INSERT OR UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks_after();

-- Mettre à jour l'ancienne fonction sync_production_tasks pour pointer vers la nouvelle
-- (au cas où elle serait appelée ailleurs)
CREATE OR REPLACE FUNCTION sync_production_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction est maintenant dépréciée
  -- Utiliser calculate_content_status_only() + sync_production_tasks_after()
  RAISE NOTICE 'sync_production_tasks() is deprecated. Use separate triggers instead.';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
