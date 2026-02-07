/*
  # Supprimer TOUS les triggers INSERT pour production_tasks

  1. Problème
    - Le trigger sync_production_tasks_trigger sur INSERT est toujours actif
    - Il cause des erreurs FK car il tente de créer des tâches avant que le contenu existe
    - Code 409 Conflict

  2. Solution
    - Supprimer TOUS les triggers sur INSERT
    - Garder UNIQUEMENT le trigger sur UPDATE
    - Les tâches seront créées uniquement quand l'utilisateur ajoute/modifie des dates

  3. Sécurité
    - Les données ne seront créées que sur UPDATE explicite
*/

-- Supprimer TOUS les triggers de synchronisation sur INSERT
DROP TRIGGER IF EXISTS sync_production_tasks_trigger ON content_calendar;
DROP TRIGGER IF EXISTS trigger_sync_production_tasks_insert ON content_calendar;
DROP TRIGGER IF EXISTS trigger_sync_production_tasks ON content_calendar;

-- Garder UNIQUEMENT le trigger sur UPDATE (déjà créé dans la migration précédente)
-- trigger_sync_production_tasks_update existe déjà et fonctionne correctement