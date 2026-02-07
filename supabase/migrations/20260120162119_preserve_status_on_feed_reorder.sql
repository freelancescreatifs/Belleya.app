/*
  # Préserver le statut lors de la réorganisation du feed Instagram

  1. Problème
    - Le trigger `sync_production_tasks` recalcule automatiquement le statut à chaque UPDATE
    - Quand le Feed Instagram réorganise les contenus, il met à jour feed_order et publication_date
    - Cela déclenche le trigger qui peut changer le statut en 'published' si publication_date <= aujourd'hui
    - Le Feed Instagram est une prévisualisation/planification, pas une confirmation de publication

  2. Solution
    - Modifier la fonction sync_production_tasks pour détecter les mises à jour du feed
    - Si SEULEMENT feed_order, publication_date, ou publication_time changent (pas les dates de production)
    - Alors préserver le statut actuel au lieu de le recalculer
    - Le statut ne doit être recalculé QUE quand les dates de production changent

  3. Sécurité
    - Cette modification n'affecte pas la logique normale de production
    - Le statut continue d'être calculé quand on modifie les dates de production
    - Seules les mises à jour liées au feed préservent le statut
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
      OLD.date_subtitles IS DISTINCT FROM NEW.date_subtitles OR
      OLD.date_validation IS DISTINCT FROM NEW.date_validation OR
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

  v_step_name := 'subtitles';
  v_step_label := 'Sous-titres - ' || NEW.title;
  v_step_date := NEW.date_subtitles;
  v_step_time := COALESCE(NEW.date_subtitles_time, '09:00');

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

  v_step_name := 'validation';
  v_step_label := 'Validation - ' || NEW.title;
  v_step_date := NEW.date_validation;
  v_step_time := COALESCE(NEW.date_validation_time, '09:00');

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
    NEW.date_subtitles,
    NEW.date_validation,
    NEW.date_scheduling,
    NEW.publication_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;