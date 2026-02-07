/*
  # Supprimer le trigger conflictuel et garder uniquement la RPC

  1. Problème
    - Deux systèmes gèrent les étapes de production (RPC + trigger)
    - Ils se marchent dessus et créent des boucles
    - Le trigger interfère avec la RPC qui gère aussi les tâches

  2. Solution
    - Supprimer le trigger BEFORE UPDATE
    - Garder uniquement la fonction RPC cascade_production_steps
    - La RPC gère déjà les deux sens (cochage + décochage)
*/

-- Supprimer le trigger que j'ai créé qui interfère
DROP TRIGGER IF EXISTS trigger_production_bidirectional_logic ON content_calendar;
DROP FUNCTION IF EXISTS handle_production_steps_logic();

-- La fonction RPC cascade_production_steps fait déjà tout le travail
-- Elle gère le cochage (backward) et le décochage (forward)
-- Plus besoin de trigger additionnel
