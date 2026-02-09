/*
  # Correction complète de la logique de production : Tâches + Agenda + Checkbox

  ## Problème identifié

  1. Logique incohérente entre dates de production, tâches et checkboxes
  2. Les tâches ne sont créées que quand on coche, pas quand on définit une date
  3. Décocher supprime la date ET la tâche (mauvais comportement)
  4. Les checkboxes ne reflètent pas l'état réel des tâches

  ## Nouvelle logique attendue

  1. **Création automatique** : Dès qu'une date de production existe → créer la tâche (completed = false)
  2. **Checkbox = Statut** : Cocher/décocher change UNIQUEMENT le statut completed
  3. **Persistance** : La tâche existe tant que la date existe, indépendamment du statut
  4. **Agenda** : Toutes les tâches (terminées ou non) apparaissent dans l'agenda

  ## Solutions

  - Désactiver la suppression des dates quand on décoche
  - Modifier cascade_production_steps pour gérer UNIQUEMENT le statut completed
  - Garder le trigger sync_production_tasks pour la création automatique
*/

-- 1) Corriger le trigger qui ne doit PLUS supprimer les dates quand on décoche
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

  -- Si la tâche est cochée ET que la date n'existe pas encore, on la crée
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Utiliser la date de la tâche (end_date ou start_date)
    v_new_date := COALESCE(NEW.end_date, NEW.start_date, CURRENT_DATE);

    -- Vérifier si la date existe déjà dans le contenu
    DECLARE
      v_existing_date date;
    BEGIN
      EXECUTE format('SELECT %I FROM content_calendar WHERE id = $1', v_date_column)
      INTO v_existing_date
      USING v_content_id;

      -- Ne mettre à jour que si la date n'existe pas déjà
      IF v_existing_date IS NULL THEN
        EXECUTE format('
          UPDATE content_calendar
          SET %I = $1,
              updated_at = now()
          WHERE id = $2
        ', v_date_column)
        USING v_new_date, v_content_id;
      END IF;
    END;
  END IF;

  -- IMPORTANT : NE PLUS SUPPRIMER LA DATE QUAND ON DÉCOCHE
  -- La date reste, seul le statut completed change
  -- Si l'utilisateur veut vraiment supprimer l'étape, il doit supprimer la date manuellement

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_content_dates_from_task() IS
'Synchronisation tasks → content : Met à jour la date de production si elle n''existe pas, mais ne la supprime JAMAIS';

-- 2) Simplifier cascade_production_steps pour gérer UNIQUEMENT le statut completed
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
  v_task_id uuid;
  v_result jsonb := '{}'::jsonb;
BEGIN
  -- Activer le flag pour éviter les boucles
  PERFORM set_config('app.in_production_cascade', 'true', true);

  BEGIN
    -- Récupérer les infos du contenu
    SELECT content_type, user_id, company_id, title
    INTO v_content_type, v_user_id, v_company_id, v_content_title
    FROM content_calendar
    WHERE id = p_content_id;

    IF NOT FOUND THEN
      PERFORM set_config('app.in_production_cascade', 'false', true);
      RAISE EXCEPTION 'Content not found';
    END IF;

    -- Obtenir les étapes pertinentes pour ce type de contenu
    v_relevant_steps := get_relevant_steps(v_content_type);

    -- CAS SPÉCIAL : Switch "Publié/Non publié" (cocher/décocher tout)
    IF p_step = 'published' THEN
      IF p_checked THEN
        -- Cocher "Publié" → marquer toutes les tâches comme terminées
        FOR v_step_name IN SELECT unnest(v_relevant_steps)
        LOOP
          SELECT pt.task_id INTO v_task_id
          FROM production_tasks pt
          WHERE pt.content_id = p_content_id
            AND pt.production_step = v_step_name;

          IF v_task_id IS NOT NULL THEN
            UPDATE tasks
            SET completed = true,
                completed_at = now(),
                last_completed_date = CURRENT_DATE
            WHERE id = v_task_id;
          END IF;
        END LOOP;

        v_result := jsonb_build_object('updated_steps', v_relevant_steps, 'published', true);
      ELSE
        -- Décocher "Publié" → marquer toutes les tâches comme non terminées
        FOR v_step_name IN SELECT unnest(v_relevant_steps)
        LOOP
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

      PERFORM set_config('app.in_production_cascade', 'false', true);
      RETURN v_result;
    END IF;

    -- TOGGLE MANUEL D'UNE ÉTAPE : Cascade forward/backward selon le contexte

    -- Trouver l'index de l'étape dans le tableau complet
    v_step_index := array_position(v_all_steps, p_step);

    IF v_step_index IS NULL THEN
      PERFORM set_config('app.in_production_cascade', 'false', true);
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

      -- Mettre à jour le statut completed des tâches
      FOREACH v_step_name IN ARRAY v_steps_to_update
      LOOP
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = p_content_id
          AND pt.production_step = v_step_name;

        IF v_task_id IS NOT NULL THEN
          UPDATE tasks
          SET completed = true,
              completed_at = now(),
              last_completed_date = COALESCE(last_completed_date, CURRENT_DATE)
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

      -- Mettre à jour le statut completed des tâches (les laisser dans l'agenda)
      FOREACH v_step_name IN ARRAY v_steps_to_update
      LOOP
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
      -- En cas d'erreur, désactiver le flag
      PERFORM set_config('app.in_production_cascade', 'false', true);
      RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION cascade_production_steps IS
'Gère le cochage/décochage en cascade des étapes de production. Change UNIQUEMENT le statut completed des tâches, sans toucher aux dates.';

-- 3) Mettre à jour toutes les tâches de production existantes pour s'assurer qu'elles sont visibles dans l'agenda
UPDATE tasks
SET show_in_calendar = true,
    duration_minutes = COALESCE(duration_minutes, 60)
WHERE production_step IS NOT NULL;

-- 4) Créer les tâches manquantes pour les contenus qui ont des dates mais pas de tâches
DO $$
DECLARE
  v_content record;
  v_task_id uuid;
  v_existing_task_id uuid;
BEGIN
  FOR v_content IN
    SELECT id, user_id, company_id, title, content_type,
           date_script, date_script_time, date_script_end_time,
           date_shooting, date_shooting_time, date_shooting_end_time,
           date_editing, date_editing_time, date_editing_end_time,
           date_scheduling, date_scheduling_time, date_scheduling_end_time
    FROM content_calendar
    WHERE user_id IS NOT NULL
  LOOP
    -- Script
    IF v_content.date_script IS NOT NULL THEN
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = v_content.id AND production_step = 'script';

      IF v_existing_task_id IS NULL THEN
        INSERT INTO tasks (
          user_id, company_id, title, description,
          end_date, start_date, start_time, end_time, duration_minutes,
          tags, production_step, status, category, priority, show_in_calendar,
          completed
        )
        VALUES (
          v_content.user_id, v_content.company_id, 'Écriture - ' || v_content.title,
          'Tâche générée automatiquement pour le contenu: ' || v_content.title,
          v_content.date_script, v_content.date_script,
          COALESCE(v_content.date_script_time::time, '09:00'::time),
          COALESCE(v_content.date_script_end_time::time, '10:00'::time),
          60,
          'content:' || v_content.id::text, 'script', 'todo', 'content', 'medium', true,
          false
        )
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (v_content.id, v_task_id, 'script');
      END IF;
    END IF;

    -- Shooting
    IF v_content.date_shooting IS NOT NULL THEN
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = v_content.id AND production_step = 'shooting';

      IF v_existing_task_id IS NULL THEN
        INSERT INTO tasks (
          user_id, company_id, title, description,
          end_date, start_date, start_time, end_time, duration_minutes,
          tags, production_step, status, category, priority, show_in_calendar,
          completed
        )
        VALUES (
          v_content.user_id, v_content.company_id, 'Tournage - ' || v_content.title,
          'Tâche générée automatiquement pour le contenu: ' || v_content.title,
          v_content.date_shooting, v_content.date_shooting,
          COALESCE(v_content.date_shooting_time::time, '09:00'::time),
          COALESCE(v_content.date_shooting_end_time::time, '10:00'::time),
          60,
          'content:' || v_content.id::text, 'shooting', 'todo', 'content', 'medium', true,
          false
        )
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (v_content.id, v_task_id, 'shooting');
      END IF;
    END IF;

    -- Editing
    IF v_content.date_editing IS NOT NULL THEN
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = v_content.id AND production_step = 'editing';

      IF v_existing_task_id IS NULL THEN
        INSERT INTO tasks (
          user_id, company_id, title, description,
          end_date, start_date, start_time, end_time, duration_minutes,
          tags, production_step, status, category, priority, show_in_calendar,
          completed
        )
        VALUES (
          v_content.user_id, v_content.company_id, 'Montage - ' || v_content.title,
          'Tâche générée automatiquement pour le contenu: ' || v_content.title,
          v_content.date_editing, v_content.date_editing,
          COALESCE(v_content.date_editing_time::time, '09:00'::time),
          COALESCE(v_content.date_editing_end_time::time, '10:00'::time),
          60,
          'content:' || v_content.id::text, 'editing', 'todo', 'content', 'medium', true,
          false
        )
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (v_content.id, v_task_id, 'editing');
      END IF;
    END IF;

    -- Scheduling
    IF v_content.date_scheduling IS NOT NULL THEN
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = v_content.id AND production_step = 'scheduling';

      IF v_existing_task_id IS NULL THEN
        INSERT INTO tasks (
          user_id, company_id, title, description,
          end_date, start_date, start_time, end_time, duration_minutes,
          tags, production_step, status, category, priority, show_in_calendar,
          completed
        )
        VALUES (
          v_content.user_id, v_content.company_id, 'Programmation - ' || v_content.title,
          'Tâche générée automatiquement pour le contenu: ' || v_content.title,
          v_content.date_scheduling, v_content.date_scheduling,
          COALESCE(v_content.date_scheduling_time::time, '09:00'::time),
          COALESCE(v_content.date_scheduling_end_time::time, '10:00'::time),
          60,
          'content:' || v_content.id::text, 'scheduling', 'todo', 'content', 'medium', true,
          false
        )
        RETURNING id INTO v_task_id;

        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (v_content.id, v_task_id, 'scheduling');
      END IF;
    END IF;
  END LOOP;
END;
$$;