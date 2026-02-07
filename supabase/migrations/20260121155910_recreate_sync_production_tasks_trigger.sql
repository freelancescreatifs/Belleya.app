/*
  # Recréer le trigger de synchronisation des tâches de production

  1. Problème
    - Le trigger sync_production_tasks a été supprimé par erreur
    - Les tâches de production ne sont jamais créées dans la table production_tasks
    - Quand l'utilisateur coche une étape, cascade_production_steps ne trouve pas la tâche
    - Du coup, la checkbox se décoche automatiquement après le reload
  
  2. Solution
    - Recréer le trigger qui synchronise les tâches de production
    - Se déclenche sur INSERT et UPDATE de content_calendar
    - Crée/met à jour/supprime les tâches selon les dates de production
  
  3. Comportement
    - Si date_xxx IS NOT NULL → Créer/mettre à jour la tâche
    - Si date_xxx IS NULL → Supprimer la tâche
    - Évite les doublons en vérifiant l'existence avant insertion
*/

-- Recréer le trigger sur UPDATE uniquement
-- (pas sur INSERT car les contenus sont créés sans dates de production)
CREATE TRIGGER trigger_sync_production_tasks_update
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();

COMMENT ON TRIGGER trigger_sync_production_tasks_update ON content_calendar IS
'Synchronise automatiquement les tâches de production quand les dates changent.
Se déclenche sur UPDATE pour créer/mettre à jour/supprimer les tâches.';
