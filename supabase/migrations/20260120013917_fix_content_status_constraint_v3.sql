/*
  # Corriger la contrainte de statut du contenu

  1. Modifications
    - Supprimer la contrainte existante
    - Mettre à jour les données existantes pour utiliser les nouveaux statuts
    - Créer la nouvelle contrainte avec les bons statuts
    - Nouveaux statuts : idea, script, shooting, editing, scheduled, published

  2. Migration des données
    - writing → script
    - scheduling → scheduled
    - Les autres statuts restent identiques
*/

-- Supprimer l'ancienne contrainte d'abord
ALTER TABLE content_calendar DROP CONSTRAINT IF EXISTS content_calendar_status_check;

-- Mettre à jour les statuts existants
UPDATE content_calendar SET status = 'script' WHERE status = 'writing';
UPDATE content_calendar SET status = 'scheduled' WHERE status = 'scheduling';

-- Créer la nouvelle contrainte avec les bons statuts
ALTER TABLE content_calendar ADD CONSTRAINT content_calendar_status_check 
CHECK (status IN ('idea', 'script', 'shooting', 'editing', 'scheduled', 'published'));
