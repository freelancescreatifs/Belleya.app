/*
  # Nettoyage de l'ancienne logique cascade

  ## Problème
  L'ancienne fonction `cascade_production_steps` modifie les dates automatiquement.
  Cela viole la règle : les dates NE DOIVENT JAMAIS changer automatiquement.

  ## Solution
  Supprimer toutes les anciennes fonctions et triggers obsolètes.
  Conserver uniquement la nouvelle logique avec checkboxes séparées des dates.
*/

-- ================================================================
-- 1. SUPPRIMER LES TRIGGERS OBSOLÈTES
-- ================================================================

-- Trigger sur content_calendar
DROP TRIGGER IF EXISTS trigger_auto_update_post_status ON content_calendar;

-- Trigger sur tasks
DROP TRIGGER IF EXISTS trigger_cascade_complete_tasks ON tasks;

-- ================================================================
-- 2. SUPPRIMER LES FONCTIONS OBSOLÈTES (avec CASCADE)
-- ================================================================

DROP FUNCTION IF EXISTS cascade_production_steps(uuid, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS auto_update_post_status() CASCADE;
DROP FUNCTION IF EXISTS calculate_post_status(date, date, date, date, date, text) CASCADE;
DROP FUNCTION IF EXISTS sync_production_tasks() CASCADE;
DROP FUNCTION IF EXISTS sync_production_tasks_after() CASCADE;
DROP FUNCTION IF EXISTS cascade_complete_previous_tasks() CASCADE;
DROP FUNCTION IF EXISTS trigger_cascade_on_uncheck() CASCADE;
DROP FUNCTION IF EXISTS should_sync_production_tasks() CASCADE;
DROP FUNCTION IF EXISTS is_in_production_cascade() CASCADE;

-- ================================================================
-- 3. RECALCULER is_published POUR TOUS LES CONTENUS
-- ================================================================

UPDATE content_calendar
SET is_published = calculate_published_tag(
  id, content_type, publication_date, publication_time,
  step_script_completed, step_shooting_completed,
  step_editing_completed, step_scheduling_completed
)
WHERE user_id IS NOT NULL;