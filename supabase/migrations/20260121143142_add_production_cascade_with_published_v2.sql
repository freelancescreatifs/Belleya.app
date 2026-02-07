/*
  # Escalade des étapes de production avec "Publié" comme 5ème étape (v2)

  1. Pipeline des étapes
    - Script → Tournage → Montage → Planifié → Publié
    - "Publié" est maintenant une étape cochable comme les autres
    - Le tag "Publié/Non publié" dépend de : étapes complètes + date de publication <= maintenant

  2. Règles de cascade
    - COCHAGE : cocher N → cocher automatiquement toutes les étapes AVANT N
    - DÉCOCHAGE : décocher N → décocher automatiquement toutes les étapes APRÈS N

  3. Fonction RPC pour la cascade
    - Gère les 5 étapes : script, shooting, editing, scheduling, published
    - Met à jour les dates de production ET les tâches
    - Optimisée pour éviter les triggers en cascade

  4. Modification de is_published
    - is_published = toutes les étapes pertinentes complétées ET date de publication <= maintenant
    - Si date de publication future → is_published = false (même si toutes les étapes sont cochées)
*/

-- Désactiver temporairement le trigger sync_production_tasks
DROP TRIGGER IF EXISTS trigger_sync_production_tasks_update ON content_calendar;

-- Fonction pour obtenir les étapes pertinentes selon le type de contenu
CREATE OR REPLACE FUNCTION get_relevant_steps(p_content_type text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
BEGIN
  CASE p_content_type
    WHEN 'post', 'story', 'live' THEN
      RETURN ARRAY['script', 'scheduling'];
    WHEN 'carrousel' THEN
      RETURN ARRAY['script', 'editing', 'scheduling'];
    WHEN 'reel', 'video' THEN
      RETURN ARRAY['script', 'shooting', 'editing', 'scheduling'];
    ELSE
      RETURN ARRAY['script', 'shooting', 'editing', 'scheduling'];
  END CASE;
END;
$$;

-- Fonction RPC pour gérer la cascade des étapes de production
CREATE OR REPLACE FUNCTION cascade_production_steps(
  p_content_id uuid,
  p_step text, -- 'script', 'shooting', 'editing', 'scheduling', 'published'
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

        -- Mettre à jour la date de production
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

      -- Mettre à jour la date de production
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
        WHERE id = v_task_id
          AND completed = true;
      END IF;
    END LOOP;

    v_result := jsonb_build_object('unchecked_steps', v_steps_to_update);
  END IF;

  RETURN v_result;
END;
$$;

-- Modifier la fonction calculate_is_published pour inclure la vérification de la date
CREATE OR REPLACE FUNCTION calculate_is_published(
  p_content_type text,
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date,
  p_publication_date date
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_all_steps_completed boolean := false;
  v_date_reached boolean := false;
BEGIN
  -- Vérifier si toutes les étapes pertinentes sont complétées
  CASE p_content_type
    WHEN 'post', 'story', 'live' THEN
      v_all_steps_completed := (p_date_script IS NOT NULL AND p_date_scheduling IS NOT NULL);
    WHEN 'carrousel' THEN
      v_all_steps_completed := (
        p_date_script IS NOT NULL AND
        p_date_editing IS NOT NULL AND
        p_date_scheduling IS NOT NULL
      );
    WHEN 'reel', 'video' THEN
      v_all_steps_completed := (
        p_date_script IS NOT NULL AND
        p_date_shooting IS NOT NULL AND
        p_date_editing IS NOT NULL AND
        p_date_scheduling IS NOT NULL
      );
    ELSE
      v_all_steps_completed := (
        p_date_script IS NOT NULL AND
        p_date_shooting IS NOT NULL AND
        p_date_editing IS NOT NULL AND
        p_date_scheduling IS NOT NULL
      );
  END CASE;

  -- Vérifier si la date de publication est atteinte ou passée
  v_date_reached := (p_publication_date <= CURRENT_DATE);

  -- Publié = toutes les étapes complétées ET date atteinte
  RETURN (v_all_steps_completed AND v_date_reached);
END;
$$;

-- Mettre à jour le trigger pour utiliser la nouvelle signature
CREATE OR REPLACE FUNCTION auto_calculate_is_published()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_published := calculate_is_published(
    NEW.content_type,
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_scheduling,
    NEW.publication_date
  );

  RETURN NEW;
END;
$$;

-- Mettre à jour tous les contenus existants avec la nouvelle logique
UPDATE content_calendar
SET is_published = calculate_is_published(
  content_type,
  date_script,
  date_shooting,
  date_editing,
  date_scheduling,
  publication_date
);

-- Fonction helper pour vérifier si un contenu peut être marqué comme publié
CREATE OR REPLACE FUNCTION can_mark_as_published(
  p_content_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_publication_date date;
  v_can_mark boolean;
  v_reason text;
BEGIN
  SELECT publication_date INTO v_publication_date
  FROM content_calendar
  WHERE id = p_content_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_mark', false,
      'reason', 'Content not found'
    );
  END IF;

  IF v_publication_date > CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'can_mark', false,
      'reason', 'future_date',
      'publication_date', v_publication_date,
      'message', 'La date de publication est dans le futur. Pour marquer comme publié, la date doit être aujourd''hui ou dans le passé.'
    );
  END IF;

  RETURN jsonb_build_object(
    'can_mark', true,
    'reason', 'ok'
  );
END;
$$;

-- Réactiver le trigger sync_production_tasks
CREATE TRIGGER trigger_sync_production_tasks_update
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();
