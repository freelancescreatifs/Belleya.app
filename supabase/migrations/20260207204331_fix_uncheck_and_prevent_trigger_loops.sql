/*
  # Correction : Permettre le décochage et éviter les boucles de triggers

  1. Problème
    - session_replication_role = 'replica' désactive TOUS les triggers
    - Cela empêche les mises à jour normales de fonctionner
    - Les utilisateurs ne peuvent plus décocher les étapes

  2. Solution
    - Utiliser une variable de session personnalisée au lieu de replica mode
    - Les triggers vérifient cette variable pour éviter les boucles
    - Modifier les triggers sync pour ne pas s'exécuter pendant cascade_production_steps

  3. Comportement
    - Cochage : cascade backward (coche les étapes précédentes)
    - Décochage : cascade forward (décoche les étapes suivantes)
    - Pas de boucle infinie entre les triggers
*/

-- Fonction pour vérifier si on est dans une cascade
CREATE OR REPLACE FUNCTION is_in_production_cascade()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN current_setting('app.in_production_cascade', true)::boolean IS TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Recréer cascade_production_steps avec variable de session
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
  -- Activer le flag de cascade pour éviter les boucles de triggers
  PERFORM set_config('app.in_production_cascade', 'true', true);

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
              completed, completed_at, last_completed_date,
              duration_minutes, show_in_calendar
            )
            VALUES (
              v_user_id, v_company_id, v_step_label,
              'Tâche générée automatiquement pour le contenu: ' || v_content_title,
              v_today, v_today, '09:00'::time,
              'content:' || p_content_id::text, v_step_name,
              'todo', 'content', 'medium',
              true, now(), v_today,
              60, true
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

      -- Désactiver le flag avant de retourner
      PERFORM set_config('app.in_production_cascade', 'false', true);
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
      -- COCHAGE : cocher toutes les étapes AVANT + l'étape elle-même (cascade backward)
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
            completed, completed_at, last_completed_date,
            duration_minutes, show_in_calendar
          )
          VALUES (
            v_user_id, v_company_id, v_step_label,
            'Tâche générée automatiquement pour le contenu: ' || v_content_title,
            v_current_date, v_current_date, '09:00'::time,
            'content:' || p_content_id::text, v_step_name,
            'todo', 'content', 'medium',
            true, now(), v_current_date,
            60, true
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
      -- DÉCOCHAGE : décocher l'étape elle-même + toutes les étapes APRÈS (cascade forward)
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

    -- Désactiver le flag avant de retourner
    PERFORM set_config('app.in_production_cascade', 'false', true);
    
    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- En cas d'erreur, s'assurer de désactiver le flag
      PERFORM set_config('app.in_production_cascade', 'false', true);
      RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION cascade_production_steps IS 
'Gère les cascades de production en préservant les dates existantes.
Utilise une variable de session pour éviter les boucles de triggers.
- COCHAGE (cascade backward) : coche toutes les étapes AVANT + l''étape elle-même
  * Script → rien d''autre
  * Tournage → coche Script
  * Montage → coche Script + Tournage
  * Planifié → coche Script + Tournage + Montage
- DÉCOCHAGE (cascade forward) : décoche l''étape elle-même + toutes les étapes APRÈS
  * Script → décoche tout
  * Tournage → décoche Montage + Planifié
  * Montage → décoche Planifié
  * Planifié → ne décoche rien d''autre
- Préserve les dates existantes lors du cochage manuel
- Crée les tâches manquantes automatiquement';

-- Modifier le trigger sync_production_tasks pour ignorer pendant cascade
DROP TRIGGER IF EXISTS trigger_sync_production_tasks_update ON content_calendar;

CREATE OR REPLACE FUNCTION sync_production_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_id uuid;
  v_step_name text;
  v_date_value date;
  v_step_label text;
  v_all_steps text[] := ARRAY['script', 'shooting', 'editing', 'scheduling'];
BEGIN
  -- Ne rien faire si on est dans une cascade (éviter la boucle)
  IF is_in_production_cascade() THEN
    RETURN NEW;
  END IF;

  -- Synchroniser chaque étape de production
  FOREACH v_step_name IN ARRAY v_all_steps
  LOOP
    -- Récupérer la valeur de la date pour cette étape
    EXECUTE format('SELECT ($1).%I', 'date_' || v_step_name)
    INTO v_date_value
    USING NEW;

    -- Label de la tâche
    v_step_label := CASE v_step_name
      WHEN 'script' THEN 'Écriture - ' || NEW.title
      WHEN 'shooting' THEN 'Tournage - ' || NEW.title
      WHEN 'editing' THEN 'Montage - ' || NEW.title
      WHEN 'scheduling' THEN 'Programmation - ' || NEW.title
    END;

    -- Trouver la tâche associée
    SELECT pt.task_id INTO v_task_id
    FROM production_tasks pt
    WHERE pt.content_id = NEW.id
      AND pt.production_step = v_step_name;

    IF v_date_value IS NOT NULL THEN
      -- L'étape est cochée
      IF v_task_id IS NULL THEN
        -- Créer la tâche si elle n'existe pas
        INSERT INTO tasks (
          user_id, company_id, title, description,
          end_date, start_date, start_time,
          tags, production_step, status, category, priority,
          completed, completed_at, last_completed_date,
          duration_minutes, show_in_calendar
        )
        VALUES (
          NEW.user_id, NEW.company_id, v_step_label,
          'Tâche générée automatiquement pour le contenu: ' || NEW.title,
          v_date_value, v_date_value, '09:00'::time,
          'content:' || NEW.id::text, v_step_name,
          'todo', 'content', 'medium',
          true, now(), v_date_value,
          60, true
        )
        RETURNING id INTO v_task_id;

        -- Lier la tâche au contenu
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      ELSE
        -- Mettre à jour la tâche existante
        UPDATE tasks
        SET completed = true,
            completed_at = now(),
            last_completed_date = v_date_value,
            end_date = v_date_value,
            start_date = v_date_value,
            title = v_step_label
        WHERE id = v_task_id;
      END IF;
    ELSE
      -- L'étape est décochée
      IF v_task_id IS NOT NULL THEN
        UPDATE tasks
        SET completed = false,
            completed_at = NULL,
            last_completed_date = NULL
        WHERE id = v_task_id;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_production_tasks_update
  AFTER UPDATE ON content_calendar
  FOR EACH ROW
  WHEN (
    OLD.date_script IS DISTINCT FROM NEW.date_script OR
    OLD.date_shooting IS DISTINCT FROM NEW.date_shooting OR
    OLD.date_editing IS DISTINCT FROM NEW.date_editing OR
    OLD.date_scheduling IS DISTINCT FROM NEW.date_scheduling
  )
  EXECUTE FUNCTION sync_production_tasks();

-- Modifier le trigger update_content_dates_from_task pour ignorer pendant cascade
DROP TRIGGER IF EXISTS trigger_update_content_dates_from_task ON tasks;

CREATE OR REPLACE FUNCTION update_content_dates_from_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id uuid;
  v_production_step text;
  v_date_column text;
BEGIN
  -- Ne rien faire si on est dans une cascade (éviter la boucle)
  IF is_in_production_cascade() THEN
    RETURN NEW;
  END IF;

  -- Vérifier si la tâche est liée à un contenu
  IF NEW.production_step IS NULL THEN
    RETURN NEW;
  END IF;

  -- Trouver le contenu associé
  SELECT content_id, production_step
  INTO v_content_id, v_production_step
  FROM production_tasks
  WHERE task_id = NEW.id;

  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_date_column := 'date_' || v_production_step;

  -- Synchroniser l'état de la tâche avec la date de production
  IF NEW.completed AND NEW.last_completed_date IS NOT NULL THEN
    -- Tâche complétée → ajouter la date
    EXECUTE format('
      UPDATE content_calendar
      SET %I = $1, updated_at = now()
      WHERE id = $2
    ', v_date_column)
    USING NEW.last_completed_date, v_content_id;
  ELSE
    -- Tâche non complétée → supprimer la date
    EXECUTE format('
      UPDATE content_calendar
      SET %I = NULL, updated_at = now()
      WHERE id = $1
    ', v_date_column)
    USING v_content_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_content_dates_from_task
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (
    OLD.completed IS DISTINCT FROM NEW.completed OR
    OLD.last_completed_date IS DISTINCT FROM NEW.last_completed_date
  )
  EXECUTE FUNCTION update_content_dates_from_task();
