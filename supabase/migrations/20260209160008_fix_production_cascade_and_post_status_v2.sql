/*
  # Implémentation complète du workflow de production avec cascade et statut post

  ## Règles métier

  1. **Cascade forward** : Cocher "Planifié" (dernière étape) coche automatiquement toutes les étapes précédentes
  2. **Cascade backward** : Décocher une étape décoche automatiquement toutes les étapes suivantes
  3. **Création automatique des tâches** : Dès qu'une date existe, la tâche est créée (completed = false)
  4. **Statut du post** :
     - Si "Planifié" est coché ET date/heure dans le passé → "published"
     - Si "Planifié" est coché ET date/heure dans le futur → "scheduled"
     - Si "Planifié" n'est PAS coché → statut basé sur les autres étapes

  ## Modifications

  - Fonction calculate_post_status : calcul du statut basé sur "Planifié" + date
  - Fonction cascade_production_steps : logique cascade complète
  - Trigger auto_update_post_status : met à jour automatiquement le statut
*/

-- 1) Fonction pour calculer le statut du post basé sur "Planifié" et la date/heure
CREATE OR REPLACE FUNCTION calculate_post_status(
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date,
  p_publication_date date,
  p_publication_time text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_publication_datetime timestamp;
  v_now timestamp;
  v_publication_time_value time;
BEGIN
  -- Si "Planifié" (date_scheduling) est coché
  IF p_date_scheduling IS NOT NULL THEN
    -- Convertir publication_time (text) en time, défaut à 00:00:00
    BEGIN
      v_publication_time_value := COALESCE(p_publication_time::time, '00:00:00'::time);
    EXCEPTION
      WHEN OTHERS THEN
        v_publication_time_value := '00:00:00'::time;
    END;

    -- Construire le datetime de publication
    v_publication_datetime := (p_publication_date || ' ' || v_publication_time_value::text)::timestamp;
    v_now := now();

    IF v_publication_datetime <= v_now THEN
      -- Date/heure dans le passé → Publié
      RETURN 'published';
    ELSE
      -- Date/heure dans le futur → Planifié
      RETURN 'scheduled';
    END IF;
  END IF;

  -- Si "Planifié" n'est PAS coché, déterminer le statut selon les autres étapes
  IF p_date_editing IS NOT NULL THEN
    RETURN 'editing';
  ELSIF p_date_shooting IS NOT NULL THEN
    RETURN 'shooting';
  ELSIF p_date_script IS NOT NULL THEN
    RETURN 'script';
  ELSE
    RETURN 'script';  -- Par défaut
  END IF;
END;
$$;

COMMENT ON FUNCTION calculate_post_status IS
'Calcule le statut du post basé sur les étapes de production complétées';

-- 2) Nouvelle version de cascade_production_steps avec logique cascade complète
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
  v_publication_date date;
  v_publication_time text;
  v_relevant_steps text[];
  v_all_steps text[] := ARRAY['script', 'shooting', 'editing', 'scheduling'];
  v_step_index int;
  v_steps_to_check text[];
  v_steps_to_uncheck text[];
  v_step_name text;
  v_task_id uuid;
  v_date_column text;
  v_existing_date date;
  v_result jsonb := '{}'::jsonb;
  v_new_status text;
  v_date_script date;
  v_date_shooting date;
  v_date_editing date;
  v_date_scheduling date;
BEGIN
  -- Activer le flag pour éviter les boucles
  PERFORM set_config('app.in_production_cascade', 'true', true);

  BEGIN
    -- Récupérer les infos du contenu
    SELECT content_type, user_id, company_id, title, publication_date, publication_time,
           date_script, date_shooting, date_editing, date_scheduling
    INTO v_content_type, v_user_id, v_company_id, v_content_title, v_publication_date, v_publication_time,
         v_date_script, v_date_shooting, v_date_editing, v_date_scheduling
    FROM content_calendar
    WHERE id = p_content_id;

    IF NOT FOUND THEN
      PERFORM set_config('app.in_production_cascade', 'false', true);
      RAISE EXCEPTION 'Content not found';
    END IF;

    -- Obtenir les étapes pertinentes pour ce type de contenu
    v_relevant_steps := get_relevant_steps(v_content_type);

    -- Trouver l'index de l'étape dans le tableau complet
    v_step_index := array_position(v_all_steps, p_step);

    IF v_step_index IS NULL THEN
      PERFORM set_config('app.in_production_cascade', 'false', true);
      RAISE EXCEPTION 'Invalid step: %', p_step;
    END IF;

    v_steps_to_check := ARRAY[]::text[];
    v_steps_to_uncheck := ARRAY[]::text[];

    IF p_checked THEN
      -- ============================================================
      -- COCHAGE (CASCADE BACKWARD) : Cocher l'étape + toutes les précédentes
      -- ============================================================
      FOR i IN 1..v_step_index LOOP
        IF v_all_steps[i] = ANY(v_relevant_steps) THEN
          v_steps_to_check := array_append(v_steps_to_check, v_all_steps[i]);
        END IF;
      END LOOP;

      -- Pour chaque étape à cocher
      FOREACH v_step_name IN ARRAY v_steps_to_check
      LOOP
        v_date_column := 'date_' || v_step_name;

        -- Vérifier si une date existe déjà
        EXECUTE format('SELECT %I FROM content_calendar WHERE id = $1', v_date_column)
        INTO v_existing_date
        USING p_content_id;

        -- Si pas de date, en créer une (date du jour)
        IF v_existing_date IS NULL THEN
          EXECUTE format('
            UPDATE content_calendar
            SET %I = CURRENT_DATE,
                updated_at = now()
            WHERE id = $1
          ', v_date_column)
          USING p_content_id;

          -- Mettre à jour les variables locales pour le calcul du statut
          CASE v_step_name
            WHEN 'script' THEN v_date_script := CURRENT_DATE;
            WHEN 'shooting' THEN v_date_shooting := CURRENT_DATE;
            WHEN 'editing' THEN v_date_editing := CURRENT_DATE;
            WHEN 'scheduling' THEN v_date_scheduling := CURRENT_DATE;
          END CASE;
        END IF;

        -- Trouver ou créer la tâche associée
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = p_content_id
          AND pt.production_step = v_step_name;

        IF v_task_id IS NULL THEN
          -- Créer la tâche
          INSERT INTO tasks (
            user_id, company_id, title, description,
            end_date, start_date, start_time, end_time, duration_minutes,
            tags, production_step, status, category, priority, show_in_calendar,
            completed, completed_at, last_completed_date
          )
          VALUES (
            v_user_id, v_company_id,
            CASE v_step_name
              WHEN 'script' THEN 'Écriture - '
              WHEN 'shooting' THEN 'Tournage - '
              WHEN 'editing' THEN 'Montage - '
              WHEN 'scheduling' THEN 'Programmation - '
            END || v_content_title,
            'Tâche générée automatiquement pour le contenu: ' || v_content_title,
            COALESCE(v_existing_date, CURRENT_DATE), COALESCE(v_existing_date, CURRENT_DATE),
            '09:00'::time, '10:00'::time, 60,
            'content:' || p_content_id::text, v_step_name, 'todo', 'content', 'medium', true,
            true, now(), CURRENT_DATE
          )
          RETURNING id INTO v_task_id;

          INSERT INTO production_tasks (content_id, task_id, production_step)
          VALUES (p_content_id, v_task_id, v_step_name);
        ELSE
          -- Mettre à jour la tâche existante : marquer comme terminée
          UPDATE tasks
          SET completed = true,
              completed_at = now(),
              last_completed_date = CURRENT_DATE
          WHERE id = v_task_id;
        END IF;
      END LOOP;

      v_result := jsonb_build_object('checked_steps', v_steps_to_check);

    ELSE
      -- ============================================================
      -- DÉCOCHAGE (CASCADE FORWARD) : Décocher l'étape + toutes les suivantes
      -- ============================================================
      FOR i IN v_step_index..array_length(v_all_steps, 1) LOOP
        IF v_all_steps[i] = ANY(v_relevant_steps) THEN
          v_steps_to_uncheck := array_append(v_steps_to_uncheck, v_all_steps[i]);
        END IF;
      END LOOP;

      -- Pour chaque étape à décocher
      FOREACH v_step_name IN ARRAY v_steps_to_uncheck
      LOOP
        -- Trouver la tâche associée
        SELECT pt.task_id INTO v_task_id
        FROM production_tasks pt
        WHERE pt.content_id = p_content_id
          AND pt.production_step = v_step_name;

        IF v_task_id IS NOT NULL THEN
          -- Mettre à jour la tâche : marquer comme non terminée
          UPDATE tasks
          SET completed = false,
              completed_at = NULL,
              last_completed_date = NULL
          WHERE id = v_task_id;
        END IF;

        -- Supprimer la date de l'étape dans content_calendar
        v_date_column := 'date_' || v_step_name;
        EXECUTE format('
          UPDATE content_calendar
          SET %I = NULL,
              updated_at = now()
          WHERE id = $1
        ', v_date_column)
        USING p_content_id;

        -- Mettre à jour les variables locales pour le calcul du statut
        CASE v_step_name
          WHEN 'script' THEN v_date_script := NULL;
          WHEN 'shooting' THEN v_date_shooting := NULL;
          WHEN 'editing' THEN v_date_editing := NULL;
          WHEN 'scheduling' THEN v_date_scheduling := NULL;
        END CASE;
      END LOOP;

      v_result := jsonb_build_object('unchecked_steps', v_steps_to_uncheck);
    END IF;

    -- ============================================================
    -- RECALCULER LE STATUT DU POST
    -- ============================================================
    v_new_status := calculate_post_status(
      v_date_script,
      v_date_shooting,
      v_date_editing,
      v_date_scheduling,
      v_publication_date,
      v_publication_time
    );

    UPDATE content_calendar
    SET status = v_new_status,
        updated_at = now()
    WHERE id = p_content_id;

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
'Gère le cochage/décochage en cascade des étapes de production selon les règles métier strictes';

-- 3) Trigger pour mettre à jour automatiquement le statut quand la date/heure change
CREATE OR REPLACE FUNCTION auto_update_post_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_status text;
BEGIN
  -- Éviter les boucles si on est déjà dans un cascade
  IF current_setting('app.in_production_cascade', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Recalculer le statut basé sur les étapes de production
  v_new_status := calculate_post_status(
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_scheduling,
    NEW.publication_date,
    NEW.publication_time
  );

  NEW.status := v_new_status;

  RETURN NEW;
END;
$$;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS trigger_auto_update_post_status ON content_calendar;

CREATE TRIGGER trigger_auto_update_post_status
  BEFORE UPDATE OF date_script, date_shooting, date_editing, date_scheduling, publication_date, publication_time ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_post_status();

COMMENT ON TRIGGER trigger_auto_update_post_status ON content_calendar IS
'Met à jour automatiquement le statut du post quand les dates de production ou publication changent';

-- 4) Mettre à jour les statuts de tous les posts existants
UPDATE content_calendar
SET status = calculate_post_status(date_script, date_shooting, date_editing, date_scheduling, publication_date, publication_time),
    updated_at = now()
WHERE user_id IS NOT NULL;