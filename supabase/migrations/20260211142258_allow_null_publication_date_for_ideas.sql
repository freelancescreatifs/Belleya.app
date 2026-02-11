/*
  # Permettre publication_date et publication_time nullables pour les idées

  1. Modifications
    - Retirer la contrainte NOT NULL sur publication_date
    - Permettre aux idées d'exister sans date de publication
    - Les idées ne s'ajoutent au calendrier qu'après sélection de la date

  2. Notes
    - Les idées sauvegardées dans la boîte à idées n'ont pas de date
    - Elles doivent être explicitement planifiées avec "À produire"
    - Compatibilité avec les fonctions existantes de détermination de statut
*/

-- Retirer la contrainte NOT NULL sur publication_date
ALTER TABLE content_calendar
  ALTER COLUMN publication_date DROP NOT NULL;

-- Mettre à jour les fonctions existantes pour gérer les NULL
-- La fonction determine_content_status gère déjà les NULL correctement
