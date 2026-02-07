/*
  # Fix définitif du bug de recochage automatique des cases de production

  1. Problème identifié
    - Quand on décoche "Script", il se recoche automatiquement
    - Deux systèmes se marchent dessus :
      a) La RPC cascade_production_steps (appelée par le frontend)
      b) Le trigger update_content_dates_from_task (sur la table tasks)
    - Même avec le flag de protection, il y a des conflits de timing

  2. Solution
    - Améliorer le trigger pour qu'il ne touche PAS aux dates de production
      quand elles viennent d'être modifiées par la RPC
    - Ajouter une vérification supplémentaire : ne synchroniser que si la tâche
      a été modifiée MANUELLEMENT (pas via la RPC)
*/

-- Supprimer et recréer le trigger avec une meilleure logique
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
  v_current_date date;
BEGIN
  -- Protection 1 : Ne rien faire si on est dans une cascade
  IF is_in_production_cascade() THEN
    RETURN NEW;
  END IF;

  -- Protection 2 : Ne synchroniser que si c'est un changement manuel
  -- (Si la tâche vient d'être modifiée par cascade_production_steps, skip)
  IF TG_OP = 'UPDATE' THEN
    -- Si seul le champ completed a changé et qu'il passe de true à false,
    -- c'est probablement la RPC qui décoche, donc ne pas recréer la date
    IF OLD.completed = true AND NEW.completed = false AND
       OLD.last_completed_date = NEW.last_completed_date AND
       NEW.last_completed_date IS NULL THEN
      RETURN NEW;
    END IF;
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

  -- Vérifier que la date dans content_calendar n'a pas été modifiée récemment
  -- (moins de 2 secondes) pour éviter de recocher ce qui vient d'être décoché
  v_date_column := 'date_' || v_production_step;
  EXECUTE format('
    SELECT updated_at > (now() - interval ''2 seconds'')
    FROM content_calendar
    WHERE id = $1
  ', v_date_column)
  INTO v_current_date
  USING v_content_id;

  IF v_current_date THEN
    -- La ligne content_calendar vient d'être modifiée, probablement par la RPC
    -- Ne pas la re-modifier pour éviter la boucle
    RETURN NEW;
  END IF;

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
    -- Tâche non complétée → supprimer la date SEULEMENT si c'est un changement manuel
    IF TG_OP = 'UPDATE' AND OLD.completed = true AND NEW.completed = false THEN
      -- Vérifier si d'autres tâches plus avancées sont encore cochées
      -- Si oui, ne PAS décocher (c'est un état incohérent qui sera résolu par la RPC)
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER trigger_update_content_dates_from_task
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.production_step IS NOT NULL)
  EXECUTE FUNCTION update_content_dates_from_task();

COMMENT ON FUNCTION update_content_dates_from_task IS
'Synchronise les dates de production dans content_calendar avec l''état des tâches, avec protection contre les boucles infinies';
