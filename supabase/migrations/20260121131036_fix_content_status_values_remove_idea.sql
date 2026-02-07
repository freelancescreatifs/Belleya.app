/*
  # Fix content status values and remove 'idea'

  1. Problème identifié
    - La contrainte CHECK autorise: 'idea', 'script', 'shooting', 'editing', 'scheduled', 'published'
    - La fonction determine_content_status retourne: 'writing', 'shooting', 'editing', 'scheduling', 'published'
    - Le ProductionStepToggle utilise: 'script', 'shooting', 'editing', 'scheduling', 'published'
    - Incohérence entre 'writing' vs 'script' et 'scheduling' vs 'scheduled'

  2. Solution
    - Supprimer 'idea' de la contrainte (comme demandé)
    - Migrer les valeurs 'idea' et 'writing' vers 'script'
    - Migrer 'scheduling' vers 'scheduled'
    - Mettre à jour la contrainte avec les valeurs correctes: 'script', 'shooting', 'editing', 'scheduled', 'published'
    - Corriger determine_content_status pour retourner les bonnes valeurs

  3. Impact
    - Plus de statut 'idea'
    - Uniformisation des valeurs de statut
    - Synchronisation complète entre base de données et interface
*/

-- Étape 1: Migrer les anciennes valeurs
UPDATE content_calendar SET status = 'script' WHERE status IN ('idea', 'writing');
UPDATE content_calendar SET status = 'scheduled' WHERE status = 'scheduling';

-- Étape 2: Supprimer l'ancienne contrainte
ALTER TABLE content_calendar DROP CONSTRAINT IF EXISTS content_calendar_status_check;

-- Étape 3: Ajouter la nouvelle contrainte sans 'idea'
ALTER TABLE content_calendar 
  ADD CONSTRAINT content_calendar_status_check
  CHECK (status IN ('script', 'shooting', 'editing', 'scheduled', 'published'));

-- Étape 4: Corriger la fonction determine_content_status pour retourner les bonnes valeurs
CREATE OR REPLACE FUNCTION determine_content_status(
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date,
  p_publication_date date
) RETURNS text AS $$
BEGIN
  -- Si publié
  IF p_publication_date IS NOT NULL AND p_publication_date <= CURRENT_DATE THEN
    RETURN 'published';
  END IF;

  -- Si programmation définie
  IF p_date_scheduling IS NOT NULL THEN
    RETURN 'scheduled';
  END IF;

  -- Si montage défini
  IF p_date_editing IS NOT NULL THEN
    RETURN 'editing';
  END IF;

  -- Si tournage défini
  IF p_date_shooting IS NOT NULL THEN
    RETURN 'shooting';
  END IF;

  -- Par défaut, script
  RETURN 'script';
END;
$$ LANGUAGE plpgsql IMMUTABLE;