/*
  # Retirer validation de la contrainte CHECK production_step

  1. Modifications
    - Mise à jour de la contrainte CHECK sur production_tasks
    - Retrait de 'validation' des valeurs autorisées
    - Seules restent : script, shooting, editing, subtitles, scheduling

  2. Objectif
    - Assurer la cohérence avec le retrait de l'étape de validation
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE production_tasks DROP CONSTRAINT IF EXISTS production_tasks_production_step_check;

-- Ajouter la nouvelle contrainte sans validation
ALTER TABLE production_tasks 
  ADD CONSTRAINT production_tasks_production_step_check
  CHECK (production_step IN ('script', 'shooting', 'editing', 'subtitles', 'scheduling'));
