/*
  # Renommer le type d'événement CLIENT en PRO (version corrigée)

  1. Modifications
    - Supprime la contrainte CHECK existante
    - Met à jour tous les événements existants de type 'client' vers 'pro'
    - Recrée la contrainte CHECK pour accepter 'pro' au lieu de 'client'
    - Conserve les types 'personal', 'google', 'planity'

  2. Logique métier
    - 'pro' = rendez-vous professionnel (avec ou sans client associé)
    - 'personal' = rendez-vous personnel
    - 'google' = événement importé de Google Calendar
    - 'planity' = événement importé de Planity

  3. Impact
    - Tous les rendez-vous existants de type 'client' deviennent 'pro'
    - Aucune perte de données
*/

-- Étape 1 : Supprimer l'ancienne contrainte CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'events' AND constraint_name = 'events_type_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_type_check;
  END IF;
END $$;

-- Étape 2 : Mettre à jour tous les événements existants de type 'client' vers 'pro'
UPDATE events
SET type = 'pro'
WHERE type = 'client';

-- Étape 3 : Ajouter la nouvelle contrainte CHECK avec 'pro' au lieu de 'client'
ALTER TABLE events
  ADD CONSTRAINT events_type_check CHECK (type IN ('pro', 'personal', 'google', 'planity'));
