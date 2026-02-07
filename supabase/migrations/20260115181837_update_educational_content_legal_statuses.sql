/*
  # Mise à jour des statuts juridiques dans educational_content

  1. Modifications
    - Remplace les anciens statuts ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl')
    - Par les nouveaux statuts ('MICRO', 'EI', 'SASU_EURL')
    - Dans la colonne legal_statuses de la table educational_content

  2. Sécurité
    - Les policies RLS existantes restent inchangées
*/

-- Mettre à jour tous les contenus éducatifs avec les nouveaux statuts
UPDATE educational_content
SET legal_statuses = ARRAY(
  SELECT CASE 
    WHEN unnest = 'auto_entreprise' THEN 'MICRO'
    WHEN unnest = 'entreprise_individuelle' THEN 'EI'
    WHEN unnest = 'sasu_eurl' THEN 'SASU_EURL'
    ELSE unnest
  END
  FROM unnest(legal_statuses)
)
WHERE 'auto_entreprise' = ANY(legal_statuses) 
   OR 'entreprise_individuelle' = ANY(legal_statuses)
   OR 'sasu_eurl' = ANY(legal_statuses);
