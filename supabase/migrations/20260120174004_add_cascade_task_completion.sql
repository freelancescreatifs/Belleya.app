/*
  # Complétion en cascade des tâches de production

  1. Nouvelles Fonctions
    - `get_production_step_order()`: Retourne l'ordre numérique d'une étape
    - `cascade_complete_previous_tasks()`: Trigger function qui complète automatiquement les tâches précédentes

  2. Nouveau Trigger
    - `trigger_cascade_complete_tasks`: Se déclenche quand une tâche est marquée terminée
    - Complète automatiquement toutes les tâches des étapes précédentes pour le même contenu

  3. Logique
    - Si je termine l'étape "editing" (ordre 3) → "script" (1) et "shooting" (2) passent terminées
    - Si je termine l'étape "shooting" (ordre 2) → "script" (1) passe terminée
    - Empêche la régression : impossible de remettre une étape précédente à "non terminé" si une étape suivante est terminée

  4. Ordre des étapes
    - script: 1
    - shooting: 2
    - editing: 3
    - scheduling: 4
*/

-- Fonction pour obtenir l'ordre numérique d'une étape de production
CREATE OR REPLACE FUNCTION get_production_step_order(step_name text)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE step_name
    WHEN 'script' THEN 1
    WHEN 'shooting' THEN 2
    WHEN 'editing' THEN 3
    WHEN 'scheduling' THEN 4
    ELSE 0
  END;
END;
$$;

-- Fonction trigger pour compléter en cascade les tâches précédentes
CREATE OR REPLACE FUNCTION cascade_complete_previous_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id uuid;
  v_current_step_order integer;
  v_previous_task record;
BEGIN
  -- Vérifier si la tâche vient d'être marquée comme terminée
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN

    -- Vérifier si c'est une tâche de production liée à un contenu
    IF NEW.production_step IS NOT NULL AND NEW.tags IS NOT NULL THEN

      -- Extraire le content_id depuis les tags (format: content:uuid)
      v_content_id := NULL;
      IF NEW.tags LIKE 'content:%' THEN
        v_content_id := substring(NEW.tags from 'content:([a-f0-9-]+)')::uuid;
      END IF;

      IF v_content_id IS NOT NULL THEN
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
    END IF;
  END IF;

  -- Empêcher la régression: si on essaie de remettre une tâche à "non terminé"
  -- et qu'une tâche suivante est déjà terminée, on bloque
  IF NEW.completed = false AND OLD.completed = true THEN
    IF NEW.production_step IS NOT NULL AND NEW.tags IS NOT NULL THEN
      v_content_id := NULL;
      IF NEW.tags LIKE 'content:%' THEN
        v_content_id := substring(NEW.tags from 'content:([a-f0-9-]+)')::uuid;
      END IF;

      IF v_content_id IS NOT NULL THEN
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_cascade_complete_tasks ON tasks;
CREATE TRIGGER trigger_cascade_complete_tasks
  BEFORE UPDATE OF completed ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION cascade_complete_previous_tasks();