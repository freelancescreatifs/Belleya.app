/*
  # BUGFIX : Empêcher le recochage automatique lors du décochage

  1. Problème
    - Quand l'utilisateur décoche "Script", l'étape se recoche automatiquement
    - Causé par des triggers récursifs ou une logique de cascade conflictuelle

  2. Solution
    - Utiliser une variable de session pour éviter la récursion des triggers
    - Assurer que le décochage d'une étape N :
      * Garde N décochée (ne jamais recocher)
      * Décoche automatiquement toutes les étapes N+1..end
    - Séparation claire entre :
      * CASCADE CHECK (vers l'arrière) : quand on COCHE une étape
      * CASCADE UNCHECK (vers l'avant) : quand on DÉCOCHE une étape

  3. Comportement attendu
    - Décocher Script → Script reste décoché + toutes les étapes suivantes décochées ✅
    - Refresh de la page → même état persiste ✅
    - Aucune logique ne doit recocher Script après son décochage ✅
*/

-- Fonction améliorée avec protection contre la récursion
CREATE OR REPLACE FUNCTION cascade_complete_previous_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id uuid;
  v_current_step_order integer;
  v_is_in_cascade boolean;
BEGIN
  -- Vérifier si on est déjà dans une cascade (éviter la récursion)
  BEGIN
    v_is_in_cascade := current_setting('app.in_cascade_trigger', true)::boolean;
  EXCEPTION WHEN OTHERS THEN
    v_is_in_cascade := false;
  END;

  -- Si on est déjà dans une cascade, ne rien faire pour éviter la récursion
  IF v_is_in_cascade THEN
    RETURN NEW;
  END IF;

  -- Vérifier si c'est une tâche de production liée à un contenu
  v_content_id := NULL;
  IF NEW.production_step IS NOT NULL AND NEW.tags IS NOT NULL AND NEW.tags LIKE 'content:%' THEN
    v_content_id := substring(NEW.tags from 'content:([a-f0-9-]+)')::uuid;
  END IF;

  -- Si ce n'est PAS une tâche de production avec content_id, on laisse passer
  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Activer le flag pour éviter la récursion
  PERFORM set_config('app.in_cascade_trigger', 'true', true);

  BEGIN
    -- CASCADE VERS LE HAUT : Si la tâche vient d'être COCHÉE
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
      v_current_step_order := get_production_step_order(NEW.production_step);

      -- Cocher toutes les tâches précédentes qui ne sont pas déjà cochées
      UPDATE tasks
      SET
        completed = true,
        completed_at = now(),
        updated_at = now()
      WHERE
        user_id = NEW.user_id
        AND tags LIKE 'content:' || v_content_id::text || '%'
        AND production_step IS NOT NULL
        AND get_production_step_order(production_step) < v_current_step_order
        AND (completed IS NULL OR completed = false);
    END IF;

    -- CASCADE VERS LE BAS : Si la tâche vient d'être DÉCOCHÉE
    IF NEW.completed = false AND OLD.completed = true THEN
      v_current_step_order := get_production_step_order(NEW.production_step);

      -- Décocher TOUTES les tâches suivantes qui sont cochées
      -- Ceci assure la cohérence : impossible d'avoir Montage coché sans Tournage
      UPDATE tasks
      SET
        completed = false,
        completed_at = NULL,
        last_completed_date = NULL,
        updated_at = now()
      WHERE
        user_id = NEW.user_id
        AND tags LIKE 'content:' || v_content_id::text || '%'
        AND production_step IS NOT NULL
        AND get_production_step_order(production_step) > v_current_step_order
        AND completed = true;
    END IF;

    -- Désactiver le flag de cascade
    PERFORM set_config('app.in_cascade_trigger', 'false', true);

  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, désactiver le flag quand même
    PERFORM set_config('app.in_cascade_trigger', 'false', true);
    RAISE;
  END;

  RETURN NEW;
END;
$$;

-- Le trigger existe déjà, pas besoin de le recréer
-- Il a été créé dans la migration 20260120174004_add_cascade_task_completion.sql
