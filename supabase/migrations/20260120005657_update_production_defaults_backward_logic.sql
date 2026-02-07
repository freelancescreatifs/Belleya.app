/*
  # Mise à jour des délais de production pour calcul en arrière

  1. Modifications
    - Mise à jour des valeurs par défaut pour calculer en arrière depuis la date de publication
    - Les délais représentent maintenant le nombre de jours AVANT la publication
    - Nouvelle logique : Publication = J, toutes les étapes sont J-X

  2. Nouvelles valeurs par défaut
    - script_delay: 5 (J-5, la plus éloignée)
    - shooting_delay: 4 (J-4)
    - editing_delay: 3 (J-3)
    - subtitles_delay: 2 (J-2)
    - validation_delay: 2 (J-2)
    - scheduling_delay: 1 (J-1, la plus proche de la publication)

  3. Impact
    - Les nouvelles valeurs s'appliqueront aux nouveaux utilisateurs
    - Les utilisateurs existants conservent leurs paramètres personnalisés
*/

-- Mettre à jour les valeurs par défaut de la table
ALTER TABLE production_defaults 
  ALTER COLUMN script_delay SET DEFAULT 5,
  ALTER COLUMN shooting_delay SET DEFAULT 4,
  ALTER COLUMN editing_delay SET DEFAULT 3,
  ALTER COLUMN subtitles_delay SET DEFAULT 2,
  ALTER COLUMN validation_delay SET DEFAULT 2,
  ALTER COLUMN scheduling_delay SET DEFAULT 1;

-- Mettre à jour les enregistrements existants qui utilisent encore les anciennes valeurs
-- (uniquement ceux qui n'ont pas été personnalisés)
UPDATE production_defaults 
SET 
  script_delay = 5,
  shooting_delay = 4,
  editing_delay = 3,
  subtitles_delay = 2,
  validation_delay = 2,
  scheduling_delay = 1,
  updated_at = now()
WHERE 
  script_delay = 0 AND
  shooting_delay = 1 AND
  editing_delay = 2 AND
  subtitles_delay = 3 AND
  validation_delay = 4 AND
  scheduling_delay = 5;
