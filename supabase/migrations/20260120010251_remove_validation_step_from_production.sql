/*
  # Retirer l'étape de validation du planning de production

  1. Modifications
    - Mise à jour de la fonction sync_production_tasks pour retirer la validation
    - Suppression des tâches de validation existantes
    - La fonction determine_content_status est aussi mise à jour

  2. Objectif
    - Simplifier le workflow de production
    - Retirer l'étape de validation qui n'est plus nécessaire
*/

-- Supprimer toutes les tâches de validation existantes
DELETE FROM production_tasks WHERE production_step = 'validation';

-- Fonction pour déterminer automatiquement le statut (mise à jour sans validation)
CREATE OR REPLACE FUNCTION determine_content_status(
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_subtitles date,
  p_date_validation date,
  p_date_scheduling date,
  p_publication_date date
) RETURNS text AS $$
BEGIN
  -- Si publié
  IF p_publication_date IS NOT NULL AND p_publication_date <= CURRENT_DATE THEN
    RETURN 'published';
  END IF;

  -- Si programmation définie
  IF p_date_scheduling IS NOT NULL THEN
    RETURN 'scheduling';
  END IF;

  -- Si montage défini
  IF p_date_editing IS NOT NULL OR p_date_subtitles IS NOT NULL THEN
    RETURN 'editing';
  END IF;

  -- Si tournage défini
  IF p_date_shooting IS NOT NULL THEN
    RETURN 'shooting';
  END IF;

  -- Par défaut, écriture
  RETURN 'writing';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour synchroniser les tâches de production (sans validation)
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
BEGIN
  -- Récupérer l'user_id et company_id du contenu
  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

  -- Traiter chaque étape de production
  
  -- Écriture (Script)
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

  -- Tournage (Shooting)
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

  -- Montage (Editing)
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

  -- Sous-titres (Subtitles)
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

  -- Programmation (Scheduling)
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

  -- Déterminer automatiquement le statut du contenu
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
