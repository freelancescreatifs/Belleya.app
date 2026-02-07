/*
  # Ajouter champs snapshot aux revenue_supplements

  1. Modifications
    - Ajouter `supplement_name` (text) pour stocker le nom au moment de la transaction
    - Ajouter `duration_minutes` (integer) pour stocker la durée au moment de la transaction
  
  2. Objectif
    - Conserver un snapshot complet des suppléments même si modifiés/supprimés plus tard
    - Permet d'afficher l'historique exact des transactions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenue_supplements' AND column_name = 'supplement_name'
  ) THEN
    ALTER TABLE revenue_supplements ADD COLUMN supplement_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenue_supplements' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE revenue_supplements ADD COLUMN duration_minutes integer DEFAULT 0;
  END IF;
END $$;