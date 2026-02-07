/*
  # Ajout des statuts de production au contenu

  1. Modifications
    - Étendre les valeurs possibles du statut pour inclure les statuts de production
    - Nouveaux statuts : 'to_shoot' (à tourner), 'to_edit' (à monter)
    - Conservation des statuts existants : 'idea', 'to_produce', 'scheduled', 'published'
    
  2. Notes
    - Permet un suivi détaillé du cycle de production du contenu
    - Statuts ordonnés selon le workflow : idea → to_shoot → to_edit → to_produce → scheduled → published
*/

-- Mettre à jour le type enum pour inclure les nouveaux statuts
DO $$ 
BEGIN
  -- Vérifier si la contrainte existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_calendar_status_check'
  ) THEN
    -- Supprimer l'ancienne contrainte
    ALTER TABLE content_calendar 
    DROP CONSTRAINT content_calendar_status_check;
  END IF;
  
  -- Ajouter la nouvelle contrainte avec tous les statuts
  ALTER TABLE content_calendar
  ADD CONSTRAINT content_calendar_status_check 
  CHECK (status IN ('idea', 'to_shoot', 'to_edit', 'to_produce', 'scheduled', 'published'));
END $$;