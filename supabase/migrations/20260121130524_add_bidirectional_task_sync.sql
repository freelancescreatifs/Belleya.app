/*
  # Synchronisation bidirectionnelle : Tâches ↔ Dates de production

  1. Objectif
    - Quand une tâche de production est cochée → mettre à jour la date de production correspondante
    - Quand une tâche de production est décochée → supprimer la date de production correspondante
    - Synchronisation complète entre le toggle d'étape et les tâches

  2. Logique
    - Trigger sur UPDATE de tasks.completed
    - Si tâche cochée → date_[step] = date du jour
    - Si tâche décochée → date_[step] = NULL
    - Le trigger sync_production_tasks() se charge ensuite de recréer/supprimer les tâches

  3. Sécurité
    - SECURITY DEFINER pour permettre les updates sur content_calendar
    - Ne s'applique QUE aux tâches de production (production_step NOT NULL)
*/

-- Fonction pour mettre à jour les dates de production depuis les tâches
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

  -- Si la tâche est cochée, mettre à jour la date avec la date du jour
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    v_new_date := CURRENT_DATE;

    -- Mise à jour dynamique de la date de production
    EXECUTE format('
      UPDATE content_calendar
      SET %I = $1,
          updated_at = now()
      WHERE id = $2
    ', v_date_column)
    USING v_new_date, v_content_id;
  END IF;

  -- Si la tâche est décochée, supprimer la date de production
  IF NEW.completed = false AND OLD.completed = true THEN
    -- Mise à jour dynamique pour mettre la date à NULL
    EXECUTE format('
      UPDATE content_calendar
      SET %I = NULL,
          updated_at = now()
      WHERE id = $1
    ', v_date_column)
    USING v_content_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur UPDATE de tasks
-- Ce trigger s'exécute AVANT le trigger cascade_complete_previous_tasks
-- pour que les dates soient mises à jour avant la cascade
DROP TRIGGER IF EXISTS trigger_update_content_dates_from_task ON tasks;

CREATE TRIGGER trigger_update_content_dates_from_task
  AFTER UPDATE OF completed ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_content_dates_from_task();