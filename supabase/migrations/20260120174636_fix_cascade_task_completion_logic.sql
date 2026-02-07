/*
  # Correction du trigger de complétion en cascade

  1. Corrections
    - Le trigger ne bloque maintenant la régression QUE pour les tâches de production liées à un contenu
    - Les autres tâches (réseaux sociaux, tâches normales) peuvent être librement modifiées
    - Simplification de la logique pour éviter les blocages inutiles
*/

-- Recréer la fonction trigger avec une logique améliorée
CREATE OR REPLACE FUNCTION cascade_complete_previous_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id uuid;
  v_current_step_order integer;
BEGIN
  -- Vérifier si c'est une tâche de production liée à un contenu
  v_content_id := NULL;
  IF NEW.production_step IS NOT NULL AND NEW.tags IS NOT NULL AND NEW.tags LIKE 'content:%' THEN
    v_content_id := substring(NEW.tags from 'content:([a-f0-9-]+)')::uuid;
  END IF;

  -- Si ce n'est PAS une tâche de production avec content_id, on laisse passer sans rien faire
  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Si la tâche vient d'être marquée comme terminée
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Obtenir l'ordre de l'étape actuelle
    v_current_step_order := get_production_step_order(NEW.production_step);

    -- Marquer toutes les tâches précédentes comme terminées
    UPDATE tasks
    SET
      completed = true,
      updated_at = now()
    WHERE
      user_id = NEW.user_id
      AND tags LIKE 'content:' || v_content_id::text || '%'
      AND production_step IS NOT NULL
      AND get_production_step_order(production_step) < v_current_step_order
      AND (completed IS NULL OR completed = false);
  END IF;

  -- Empêcher la régression: si on essaie de remettre une tâche à "non terminé"
  -- et qu'une tâche suivante est déjà terminée, on bloque
  IF NEW.completed = false AND OLD.completed = true THEN
    v_current_step_order := get_production_step_order(NEW.production_step);

    -- Vérifier si une tâche suivante est terminée
    IF EXISTS (
      SELECT 1 FROM tasks
      WHERE
        user_id = NEW.user_id
        AND tags LIKE 'content:' || v_content_id::text || '%'
        AND production_step IS NOT NULL
        AND get_production_step_order(production_step) > v_current_step_order
        AND completed = true
    ) THEN
      RAISE EXCEPTION 'Impossible de rouvrir cette tâche : des étapes suivantes sont déjà terminées. Rouvrez d''abord les étapes suivantes.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;