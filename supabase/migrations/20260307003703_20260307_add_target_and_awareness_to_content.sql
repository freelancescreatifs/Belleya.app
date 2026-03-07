/*
  # Add target audience and awareness level to content generation

  1. New Columns
    - `content_calendar.target_audience` (text) - Target audience segment
    - `content_calendar.awareness_level` (text) - Prospect awareness level

  2. Changes
    - Add target audience options: freelances débutants, freelances expérimentés, entrepreneurs, créateurs de contenu, indépendants créatifs, dirigeants/PME, étudiants/reconversion
    - Add awareness level options: problème inconscient, conscient du problème, conscient de la solution, conscient du produit, prêt à acheter
    - Default values: null (optional fields for backward compatibility)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN target_audience text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'awareness_level'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN awareness_level text;
  END IF;
END $$;

ALTER TABLE content_calendar
  ADD CONSTRAINT content_calendar_target_audience_check
  CHECK (target_audience IS NULL OR target_audience IN (
    'freelances_debutants',
    'freelances_experimentes',
    'entrepreneurs',
    'createurs_contenu',
    'independants_creatifs',
    'dirigeants_pme',
    'etudiants_reconversion'
  ));

ALTER TABLE content_calendar
  ADD CONSTRAINT content_calendar_awareness_level_check
  CHECK (awareness_level IS NULL OR awareness_level IN (
    'probleme_inconscient',
    'conscient_probleme',
    'conscient_solution',
    'conscient_produit',
    'pret_acheter'
  ));
