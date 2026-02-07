/*
  # Permettre de décocher les étapes de production avec cascade inverse

  1. Modifications
    - Supprime le blocage qui empêchait de décocher une étape si des étapes suivantes sont terminées
    - Ajoute une cascade inverse : décocher une étape décoche automatiquement les étapes suivantes
    - La logique de cascade vers le haut (cocher une étape avancée coche les précédentes) reste intacte

  2. Logique de cascade inverse
    - Si je décoche "Tournage" (ordre 2) → "Montage" (3) et "Programmation" (4) sont décochées automatiquement
    - Si je décoche "Écriture" (ordre 1) → toutes les étapes suivantes sont décochées
    - Maintient la cohérence : impossible d'avoir "Montage" terminé sans "Tournage"

  3. Comportement attendu
    Cocher "Montage" → "Écriture" et "Tournage" sont cochées automatiquement ✅
    Décocher "Tournage" → "Montage" et "Programmation" sont décochées automatiquement ✅
*/

-- Recréer la fonction trigger avec cascade bidirectionnelle
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

  -- CASCADE VERS LE HAUT : Si la tâche vient d'être marquée comme terminée
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    v_current_step_order := get_production_step_order(NEW.production_step);

    -- Marquer toutes les tâches précédentes comme terminées
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

  -- CASCADE VERS LE BAS : Si on décoche une tâche, décocher toutes les suivantes
  IF NEW.completed = false AND OLD.completed = true THEN
    v_current_step_order := get_production_step_order(NEW.production_step);

    -- Décocher automatiquement toutes les tâches suivantes
    UPDATE tasks
    SET
      completed = false,
      completed_at = NULL,
      updated_at = now()
    WHERE
      user_id = NEW.user_id
      AND tags LIKE 'content:' || v_content_id::text || '%'
      AND production_step IS NOT NULL
      AND get_production_step_order(production_step) > v_current_step_order
      AND completed = true;
  END IF;

  RETURN NEW;
END;
$$;