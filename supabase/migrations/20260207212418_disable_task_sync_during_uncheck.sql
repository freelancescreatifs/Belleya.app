/*
  # Solution radicale : désactiver la sync automatique des tâches vers content

  1. Problème
    - Le trigger update_content_dates_from_task interfère avec cascade_production_steps
    - Même avec des protections, ils créent des boucles

  2. Solution
    - Désactiver complètement ce trigger PENDANT les opérations de cascade
    - La RPC gère TOUT : dates ET tâches
    - Aucune sync automatique ne doit se déclencher pendant la cascade
*/

-- Supprimer le trigger problématique
DROP TRIGGER IF EXISTS trigger_update_content_dates_from_task ON tasks;

-- Recréer la fonction avec une logique ultra-simple : 
-- Si cascade active --> NE RIEN FAIRE
CREATE OR REPLACE FUNCTION update_content_dates_from_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si on est dans une cascade, ne JAMAIS synchroniser
  -- La RPC gère tout elle-même
  IF is_in_production_cascade() THEN
    RETURN NEW;
  END IF;

  -- Sinon, permettre une sync manuelle uniquement pour les cas
  -- où l'utilisateur coche/décoche une tâche DIRECTEMENT dans l'interface Tâches
  -- (pas via les checkboxes de production de contenu)
  
  -- Pour l'instant, on désactive complètement cette sync automatique
  -- car elle cause plus de problèmes qu'elle n'en résout
  RETURN NEW;
END;
$$;

-- Ne PAS recréer le trigger pour l'instant
-- On laisse la RPC cascade_production_steps gérer 100% de la logique

COMMENT ON FUNCTION update_content_dates_from_task IS
'Fonction désactivée temporairement pour éviter les conflits avec cascade_production_steps';
