/*
  # Corriger la fonction de préservation du statut sans les colonnes supprimées

  1. Problème
    - La migration précédente référence date_subtitles et date_validation
    - Ces colonnes ont été supprimées dans des migrations ultérieures
    - Cela cause l'erreur "record 'old' has no field 'date_subtitles'"

  2. Solution
    - Mettre à jour la fonction pour ne vérifier que les colonnes existantes :
      * date_script
      * date_shooting
      * date_editing
      * date_scheduling
    - Retirer toutes les références à date_subtitles et date_validation

  3. Logique
    - Le comportement reste identique : préserver le statut lors du drag & drop
    - Seules les colonnes existantes sont vérifiées
*/

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
  v_social_media_tag text := 'Réseaux sociaux';
  v_production_dates_changed boolean := false;
  v_is_feed_reorder boolean := false;
BEGIN
  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

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

    IF v_is_feed_reorder THEN
      RETURN NEW;
    END IF;
  END IF;

  v_step_name := 'script';
  v_step_label := 'Écriture - ' || NEW.title;
  v_step_date := NEW.date_script;
  v_step_time := COALESCE(NEW.date_script_time, '09:00');

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        due_date = v_step_date,
        due_time = v_step_time,
        tags = v_social_media_tag,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', 'medium')
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  v_step_name := 'shooting';
  v_step_label := 'Tournage - ' || NEW.title;
  v_step_date := NEW.date_shooting;
  v_step_time := COALESCE(NEW.date_shooting_time, '09:00');

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        due_date = v_step_date,
        due_time = v_step_time,
        tags = v_social_media_tag,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', 'medium')
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  v_step_name := 'editing';
  v_step_label := 'Montage - ' || NEW.title;
  v_step_date := NEW.date_editing;
  v_step_time := COALESCE(NEW.date_editing_time, '09:00');

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        due_date = v_step_date,
        due_time = v_step_time,
        tags = v_social_media_tag,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', 'medium')
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  v_step_name := 'scheduling';
  v_step_label := 'Programmation - ' || NEW.title;
  v_step_date := NEW.date_scheduling;
  v_step_time := COALESCE(NEW.date_scheduling_time, '09:00');

  IF v_step_date IS NOT NULL THEN
    SELECT task_id INTO v_existing_task_id
    FROM production_tasks
    WHERE content_id = NEW.id AND production_step = v_step_name;

    IF v_existing_task_id IS NOT NULL THEN
      UPDATE tasks SET
        title = v_step_label,
        due_date = v_step_date,
        due_time = v_step_time,
        tags = v_social_media_tag,
        updated_at = now()
      WHERE id = v_existing_task_id;
    ELSE
      INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
      VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', 'medium')
      RETURNING id INTO v_task_id;

      INSERT INTO production_tasks (content_id, task_id, production_step)
      VALUES (NEW.id, v_task_id, v_step_name);
    END IF;
  ELSE
    DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
  END IF;

  NEW.status := determine_content_status(
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NULL,
    NULL,
    NEW.date_scheduling,
    NEW.publication_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;