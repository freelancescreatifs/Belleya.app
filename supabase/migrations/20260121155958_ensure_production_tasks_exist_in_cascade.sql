/*
  # Créer automatiquement les tâches de production si elles n'existent pas

  1. Problème
    - Si une tâche de production n'existe pas dans production_tasks
    - cascade_production_steps ne trouve pas v_task_id et ne fait rien
    - La checkbox se décoche après le reload car aucune tâche n'est trouvée
  
  2. Solution
    - Modifier cascade_production_steps pour créer la tâche si elle n'existe pas
    - Garantit qu'il y a toujours une tâche à mettre à jour
  
  3. Comportement
    - Avant de mettre à jour la tâche, vérifier si elle existe
    - Si elle n'existe pas, la créer avec les bonnes valeurs
    - Ensuite, mettre à jour normalement
*/

CREATE OR REPLACE FUNCTION cascade_production_steps(
  p_content_id uuid,
  p_step text,
  p_checked boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_type text;
  v_user_id uuid;
  v_company_id uuid;
  v_content_title text;
  v_relevant_steps text[];
  v_all_steps text[] := ARRAY['script', 'shooting', 'editing', 'scheduling'];
  v_step_index int;
  v_steps_to_update text[];
  v_step_name text;
  v_date_column text;
  v_task_id uuid;
  v_today date := CURRENT_DATE;
  v_result jsonb := '{}'::jsonb;
  v_current_date date;
  v_step_label text;
BEGIN
  -- Récupérer les infos du contenu
  SELECT content_type, user_id, company_id, title
  INTO v_content_type, v_user_id, v_company_id, v_content_title
  FROM content_calendar
  WHERE id = p_content_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content not found';
  END IF;

  -- Obtenir les étapes pertinentes pour ce type de contenu
  v_relevant_steps := get_relevant_steps(v_content_type);

  -- CAS SPÉCIAL : Switch "Publié/Non publié" (cocher/décocher tout)
  IF p_step = 'published' THEN
    IF p_checked THEN
      -- Cocher "Publié" → cocher toutes les étapes pertinentes avec today
      FOR v_step_name IN SELECT unnest(v_relevant_steps)
      LOOP
        v_date_column := 'date_' || v_step_name;

        -- Pour le switch publié, on force la date à today
        EXECUTE format('
          UPDATE content_calendar
          SET %I = $1, updated_at = now()
          WHERE id = $2
        ', v_date_column)
        USING v_today, p_content_id;

        -- Label de la tâche
        v_step_label := CASE v_step_name
          WHEN 'script' THEN 'Écriture - ' || v_content_title
          WHEN 'shooting' THEN 'Tournage - ' || v_content_title
          WHEN 'editing' THEN 'Montage - ' || v_content_title
          WHEN 'scheduling' THEN 'Programmation - ' || v_content_title
        END;

        -- Chercher ou créer la tâche
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = p_content_id
          AND pt.production_step = v_step_name;

        IF v_task_id IS NULL THEN
          -- Créer la tâche si elle n'existe pas
          INSERT INTO tasks (
            user_id, company_id, title, description, 
            end_date, start_date, start_time,
            tags, production_step, status, category, priority,
            completed, completed_at, last_completed_date
          )
          VALUES (
            v_user_id, v_company_id, v_step_label,
            'Tâche générée automatiquement pour le contenu: ' || v_content_title,
            v_today, v_today, '09:00'::time,
            'content:' || p_content_id::text, v_step_name,
            'todo', 'content', 'medium',
            true, now(), v_today
          )
          RETURNING id INTO v_task_id;

          -- Lier la tâche au contenu
          INSERT INTO production_tasks (content_id, task_id, production_step)
          VALUES (p_content_id, v_task_id, v_step_name);
        ELSE
          -- Mettre à jour la tâche existante
          UPDATE tasks
          SET completed = true,
              completed_at = now(),
              last_completed_date = v_today,
              end_date = v_today,
              start_date = v_today
          WHERE id = v_task_id;
        END IF;
      END LOOP;

      v_result := jsonb_build_object('updated_steps', v_relevant_steps, 'published', true);
    ELSE
      -- Décocher "Publié" → décocher toutes les étapes pertinentes
      FOR v_step_name IN SELECT unnest(v_relevant_steps)
      LOOP
        v_date_column := 'date_' || v_step_name;

        -- Supprimer la date de production
        EXECUTE format('
          UPDATE content_calendar
          SET %I = NULL, updated_at = now()
          WHERE id = $1
        ', v_date_column)
        USING p_content_id;

        -- Mettre à jour la tâche associée
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = p_content_id
          AND pt.production_step = v_step_name;

        IF v_task_id IS NOT NULL THEN
          UPDATE tasks
          SET completed = false,
              completed_at = NULL,
              last_completed_date = NULL
          WHERE id = v_task_id;
        END IF;
      END LOOP;

      v_result := jsonb_build_object('updated_steps', v_relevant_steps, 'published', false);
    END IF;

    RETURN v_result;
  END IF;

  -- TOGGLE MANUEL D'UNE ÉTAPE : Préserver les dates existantes
  
  -- Trouver l'index de l'étape dans le tableau complet
  v_step_index := array_position(v_all_steps, p_step);

  IF v_step_index IS NULL THEN
    RAISE EXCEPTION 'Invalid step: %', p_step;
  END IF;

  v_steps_to_update := ARRAY[]::text[];

  IF p_checked THEN
    -- COCHAGE : cocher toutes les étapes AVANT + l'étape elle-même
    FOR i IN 1..v_step_index LOOP
      IF v_all_steps[i] = ANY(v_relevant_steps) THEN
        v_steps_to_update := array_append(v_steps_to_update, v_all_steps[i]);
      END IF;
    END LOOP;

    -- Mettre à jour les étapes à cocher EN PRÉSERVANT LES DATES EXISTANTES
    FOREACH v_step_name IN ARRAY v_steps_to_update
    LOOP
      v_date_column := 'date_' || v_step_name;

      -- Récupérer la date actuelle de l'étape
      EXECUTE format('SELECT %I FROM content_calendar WHERE id = $1', v_date_column)
      INTO v_current_date
      USING p_content_id;

      -- Si la date existe déjà, la conserver. Sinon, mettre today
      IF v_current_date IS NULL THEN
        EXECUTE format('
          UPDATE content_calendar
          SET %I = $1, updated_at = now()
          WHERE id = $2
        ', v_date_column)
        USING v_today, p_content_id;
        
        v_current_date := v_today;
      END IF;
      -- Si date existe déjà, on ne fait rien (on la préserve)

      -- Label de la tâche
      v_step_label := CASE v_step_name
        WHEN 'script' THEN 'Écriture - ' || v_content_title
        WHEN 'shooting' THEN 'Tournage - ' || v_content_title
        WHEN 'editing' THEN 'Montage - ' || v_content_title
        WHEN 'scheduling' THEN 'Programmation - ' || v_content_title
      END;

      -- Chercher ou créer la tâche
      SELECT pt.task_id INTO v_task_id
      FROM production_tasks pt
      WHERE pt.content_id = p_content_id
        AND pt.production_step = v_step_name;

      IF v_task_id IS NULL THEN
        -- Créer la tâche si elle n'existe pas
        INSERT INTO tasks (
          user_id, company_id, title, description,
          end_date, start_date, start_time,
          tags, production_step, status, category, priority,
          completed, completed_at, last_completed_date
        )
        VALUES (
          v_user_id, v_company_id, v_step_label,
          'Tâche générée automatiquement pour le contenu: ' || v_content_title,
          v_current_date, v_current_date, '09:00'::time,
          'content:' || p_content_id::text, v_step_name,
          'todo', 'content', 'medium',
          true, now(), v_current_date
        )
        RETURNING id INTO v_task_id;

        -- Lier la tâche au contenu
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (p_content_id, v_task_id, v_step_name);
      ELSE
        -- Mettre à jour la tâche existante
        UPDATE tasks
        SET completed = true,
            completed_at = now(),
            last_completed_date = COALESCE(last_completed_date, v_current_date),
            end_date = v_current_date,
            start_date = v_current_date
        WHERE id = v_task_id;
      END IF;
    END LOOP;

    v_result := jsonb_build_object('checked_steps', v_steps_to_update);
  ELSE
    -- DÉCOCHAGE : décocher l'étape elle-même + toutes les étapes APRÈS
    FOR i IN v_step_index..array_length(v_all_steps, 1) LOOP
      IF v_all_steps[i] = ANY(v_relevant_steps) THEN
        v_steps_to_update := array_append(v_steps_to_update, v_all_steps[i]);
      END IF;
    END LOOP;

    -- Mettre à jour les dates et tâches pour les étapes à décocher
    FOREACH v_step_name IN ARRAY v_steps_to_update
    LOOP
      v_date_column := 'date_' || v_step_name;

      -- Supprimer la date de production (décocher)
      EXECUTE format('
        UPDATE content_calendar
        SET %I = NULL, updated_at = now()
        WHERE id = $1
      ', v_date_column)
      USING p_content_id;

      -- Mettre à jour la tâche associée
      SELECT pt.task_id INTO v_task_id
      FROM production_tasks pt
      WHERE pt.content_id = p_content_id
        AND pt.production_step = v_step_name;

      IF v_task_id IS NOT NULL THEN
        UPDATE tasks
        SET completed = false,
            completed_at = NULL,
            last_completed_date = NULL
        WHERE id = v_task_id;
      END IF;
    END LOOP;

    v_result := jsonb_build_object('unchecked_steps', v_steps_to_update);
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION cascade_production_steps IS 
'Gère les cascades de production en préservant les dates existantes.
Crée automatiquement les tâches de production si elles n''existent pas.
- Toggle manuel : préserve les dates existantes, met today seulement si NULL
- Switch Publié/Non publié : force les dates à today pour garantir cohérence
- Cascade backward lors du cochage
- Cascade forward lors du décochage
- Crée les tâches manquantes automatiquement';
