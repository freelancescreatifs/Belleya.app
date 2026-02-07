/*
  # BUGFIX : Décocher toutes les étapes suivantes sans blocage
  
  1. Problème identifié
    - La protection anti-récursion bloque les UPDATE successifs du frontend
    - Quand le frontend décoche Script puis essaie de décocher Tournage/Montage/Planification
    - Le flag 'app.in_cascade_trigger' reste à true et empêche le trigger de s'exécuter
    - Résultat : seulement la première étape déclenche la cascade
  
  2. Solution
    - Retirer complètement la protection anti-récursion
    - Le trigger est safe car il ne crée pas de boucle infinie :
      * Décocher N → décoche N+1..end (cascade vers l'avant uniquement)
      * Pas de cascade vers l'arrière lors du décochage
    - Simplifier la logique pour plus de fiabilité
  
  3. Comportement garanti
    - Décocher Script → Script + Tournage + Montage + Planification décochés ✅
    - Cocher Montage → Montage + Script + Tournage cochés ✅
    - Aucun recochage automatique ✅
*/

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

  -- Si ce n'est PAS une tâche de production avec content_id, on laisse passer
  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_current_step_order := get_production_step_order(NEW.production_step);

  -- CASCADE VERS LE HAUT : Si la tâche vient d'être COCHÉE
  -- Cocher automatiquement toutes les tâches précédentes qui ne sont pas déjà cochées
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
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
  -- Décocher automatiquement TOUTES les tâches suivantes qui sont cochées
  IF NEW.completed = false AND OLD.completed = true THEN
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

  RETURN NEW;
END;
$$;

-- Le trigger existe déjà depuis la migration 20260120174004_add_cascade_task_completion.sql
-- Pas besoin de le recréer
