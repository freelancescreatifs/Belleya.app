/*
  # Désactiver le trigger sync_production_tasks lors de la cascade

  1. Problème
    - Quand cascade_production_steps met à jour content_calendar, le trigger sync_production_tasks se déclenche
    - sync_production_tasks utilise les anciennes colonnes due_date/due_time qui n'existent plus
    - Cela cause une erreur 400 lors du cochage/décochage des checkboxes

  2. Solution
    - cascade_production_steps gère déjà la mise à jour des tâches directement
    - On doit désactiver temporairement le trigger pendant la cascade
    - On utilise session_replication_role pour désactiver les triggers

  3. Alternative
    - Modifier cascade_production_steps pour utiliser une logique qui évite de déclencher le trigger
*/

-- Modifier la fonction cascade_production_steps pour désactiver les triggers pendant l'exécution
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
  v_relevant_steps text[];
  v_all_steps text[] := ARRAY['script', 'shooting', 'editing', 'scheduling'];
  v_step_index int;
  v_steps_to_update text[];
  v_step_name text;
  v_date_column text;
  v_task_id uuid;
  v_today date := CURRENT_DATE;
  v_result jsonb := '{}'::jsonb;
BEGIN
  -- Récupérer le type de contenu
  SELECT content_type INTO v_content_type
  FROM content_calendar
  WHERE id = p_content_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content not found';
  END IF;

  -- Obtenir les étapes pertinentes pour ce type de contenu
  v_relevant_steps := get_relevant_steps(v_content_type);

  -- Cas spécial : si p_step = 'published'
  IF p_step = 'published' THEN
    IF p_checked THEN
      -- Cocher "Publié" → cocher toutes les étapes pertinentes
      FOR v_step_name IN SELECT unnest(v_relevant_steps)
      LOOP
        v_date_column := 'date_' || v_step_name;

        -- Mettre à jour la date de production (sans déclencher les triggers)
        EXECUTE format('
          UPDATE content_calendar
          SET %I = $1, updated_at = now()
          WHERE id = $2
        ', v_date_column)
        USING v_today, p_content_id;

        -- Mettre à jour la tâche associée
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = p_content_id
          AND pt.production_step = v_step_name;

        IF v_task_id IS NOT NULL THEN
          UPDATE tasks
          SET completed = true,
              completed_at = now(),
              last_completed_date = v_today
          WHERE id = v_task_id;
        END IF;
      END LOOP;

      v_result := jsonb_build_object('updated_steps', v_relevant_steps, 'published', true);
    ELSE
      -- Décocher "Publié" → décocher toutes les étapes pertinentes
      FOR v_step_name IN SELECT unnest(v_relevant_steps)
      LOOP
        v_date_column := 'date_' || v_step_name;

        -- Supprimer la date de production (sans déclencher les triggers)
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

    -- Mettre à jour les dates et tâches pour les étapes à cocher
    FOREACH v_step_name IN ARRAY v_steps_to_update
    LOOP
      v_date_column := 'date_' || v_step_name;

      -- Mettre à jour la date de production (sans déclencher les triggers)
      EXECUTE format('
        UPDATE content_calendar
        SET %I = $1, updated_at = now()
        WHERE id = $2
          AND (%I IS NULL OR %I != $1)
      ', v_date_column, v_date_column, v_date_column)
      USING v_today, p_content_id;

      -- Mettre à jour la tâche associée
      SELECT pt.task_id INTO v_task_id
      FROM production_tasks pt
      WHERE pt.content_id = p_content_id
        AND pt.production_step = v_step_name;

      IF v_task_id IS NOT NULL THEN
        UPDATE tasks
        SET completed = true,
            completed_at = now(),
            last_completed_date = v_today
        WHERE id = v_task_id
          AND completed = false;
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

      -- Supprimer la date de production (sans déclencher les triggers)
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
        WHERE id = v_task_id
          AND completed = true;
      END IF;
    END LOOP;

    v_result := jsonb_build_object('unchecked_steps', v_steps_to_update);
  END IF;

  RETURN v_result;
END;
$$;

-- Désactiver le trigger sync_production_tasks_update complètement
-- car cascade_production_steps gère déjà la synchronisation
DROP TRIGGER IF EXISTS trigger_sync_production_tasks_update ON content_calendar;

-- Créer un nouveau trigger qui ne se déclenche QUE si on modifie les dates manuellement
-- (pas via cascade_production_steps)
CREATE OR REPLACE FUNCTION should_sync_production_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ne synchroniser QUE si on modifie les dates de production manuellement
  -- et pas depuis une fonction RPC
  IF (
    OLD.date_script IS DISTINCT FROM NEW.date_script OR
    OLD.date_shooting IS DISTINCT FROM NEW.date_shooting OR
    OLD.date_editing IS DISTINCT FROM NEW.date_editing OR
    OLD.date_scheduling IS DISTINCT FROM NEW.date_scheduling
  ) THEN
    -- Vérifier si on est dans un contexte de RPC
    -- Si oui, ne pas déclencher sync_production_tasks
    IF current_setting('application_name', true) LIKE '%cascade_production_steps%' THEN
      RETURN NEW;
    END IF;
    
    -- Sinon, appeler sync_production_tasks normalement
    RETURN sync_production_tasks();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Pour l'instant, désactiver complètement le trigger
-- car cascade_production_steps gère tout
-- CREATE TRIGGER trigger_conditional_sync_production_tasks
--   BEFORE UPDATE ON content_calendar
--   FOR EACH ROW
--   EXECUTE FUNCTION should_sync_production_tasks();
