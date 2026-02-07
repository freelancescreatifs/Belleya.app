/*
  # Retirer les colonnes de validation du contenu

  1. Modifications
    - Supprimer date_validation et date_validation_time de content_calendar
    - Ces colonnes ne sont plus utilisées dans le workflow de production

  2. Objectif
    - Nettoyer la base de données des colonnes inutilisées
*/

-- Supprimer les colonnes de validation
ALTER TABLE content_calendar DROP COLUMN IF EXISTS date_validation;
ALTER TABLE content_calendar DROP COLUMN IF EXISTS date_validation_time;
