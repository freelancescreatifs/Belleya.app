/*
  # Correction des contraintes revenue_supplements
  
  1. Modifications
    - Mettre supplement_name NOT NULL (requis pour snapshot)
    - Mettre duration_minutes nullable (pour formations sans durée)
    - Supprimer DEFAULT 0 de duration_minutes
  
  2. Objectif
    - Permettre insertion de suppléments avec duration_minutes = NULL (formations)
    - Garantir que supplement_name est toujours présent
*/

-- Modifier duration_minutes pour accepter NULL et supprimer DEFAULT
DO $$
BEGIN
  -- Supprimer le DEFAULT si présent
  ALTER TABLE revenue_supplements 
  ALTER COLUMN duration_minutes DROP DEFAULT;
  
  -- S'assurer que la colonne accepte NULL
  ALTER TABLE revenue_supplements 
  ALTER COLUMN duration_minutes DROP NOT NULL;
END $$;

-- S'assurer que supplement_name est NOT NULL
DO $$
BEGIN
  -- Mettre une valeur par défaut pour les enregistrements existants sans nom
  UPDATE revenue_supplements 
  SET supplement_name = 'Supplément'
  WHERE supplement_name IS NULL;
  
  -- Ajouter la contrainte NOT NULL
  ALTER TABLE revenue_supplements 
  ALTER COLUMN supplement_name SET NOT NULL;
END $$;