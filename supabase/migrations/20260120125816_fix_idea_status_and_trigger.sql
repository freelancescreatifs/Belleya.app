/*
  # Corriger le statut 'idea' et le trigger de synchronisation

  1. Problème identifié
    - Le trigger sync_production_tasks() transforme TOUS les statuts, même 'idea'
    - La fonction determine_content_status() ne retourne jamais 'idea'
    - Cela empêche la création d'idées de contenu
    - Erreur 406 lors de l'insertion

  2. Solution
    - Modifier le trigger pour préserver le statut 'idea'
    - Ne pas appeler determine_content_status() si le statut est 'idea'
    - Permettre aux idées d'exister sans dates de production

  3. Garanties
    - Les idées restent avec status='idea' jusqu'à passage en production
    - Le trigger ne crée PAS de tâches pour les idées
    - Une fois qu'une date de production est ajoutée, le statut est calculé
*/

-- Modifier la fonction trigger pour préserver le statut 'idea'
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
  v_step_time text;
  v_priority text;
  v_social_media_tag text := 'Réseaux sociaux';
BEGIN
  -- Si le statut est 'idea', ne pas toucher au statut et ne pas créer de tâches
  IF NEW.status = 'idea' THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'user_id et company_id du contenu
  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

  -- Traiter chaque étape de production avec gestion d'erreur

  -- Écriture (Script)
  BEGIN
    v_step_name := 'script';
    v_step_label := 'Écriture - ' || NEW.title;
    v_step_date := NEW.date_script;
    v_step_time := COALESCE(NEW.date_script_time, '09:00');

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
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
    v_step_time := COALESCE(NEW.date_shooting_time, '09:00');

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
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
    v_step_time := COALESCE(NEW.date_editing_time, '09:00');

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
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
    v_step_time := COALESCE(NEW.date_scheduling_time, '09:00');

    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);

      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
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

  -- Déterminer automatiquement le statut du contenu SEULEMENT s'il n'est pas 'idea'
  IF NEW.status != 'idea' THEN
    NEW.status := determine_content_status(
      NEW.date_script,
      NEW.date_shooting,
      NEW.date_editing,
      NEW.date_subtitles,
      NEW.date_validation,
      NEW.date_scheduling,
      NEW.publication_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;