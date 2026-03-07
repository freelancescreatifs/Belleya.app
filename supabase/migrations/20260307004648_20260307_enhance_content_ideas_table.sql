/*
  # Enhance content_ideas table with complete idea structure

  1. Changes
    - Add missing columns for complete idea structure
    - Add awareness_level and target_audience if not exist
    - Ensure all required columns are present

  2. Columns Added
    - hooks_alternatives (jsonb) - 3 alternative hooks
    - psychological_triggers (jsonb) - List of triggers
    - content_angle (text) - Strategic angle
    - retention_structure (jsonb) - Retention elements
    - conversion_version (text) - Conversion-focused version
    - visual_alignment (jsonb) - Visual recommendations
    - story_ideas (jsonb) - 3 story ideas
    - pro_tip (text) - Strategic pro tip
    - awareness_level (text) - Consciousness level
    - target_audience (text) - Free text target input
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'hooks_alternatives'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN hooks_alternatives jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'psychological_triggers'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN psychological_triggers jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'content_angle'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN content_angle text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'retention_structure'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN retention_structure jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'conversion_version'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN conversion_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'visual_alignment'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN visual_alignment jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'story_ideas'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN story_ideas jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'pro_tip'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN pro_tip text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'awareness_level'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN awareness_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN target_audience text;
  END IF;
END $$;

ALTER TABLE content_ideas
  ADD CONSTRAINT content_ideas_awareness_level_check
  CHECK (awareness_level IS NULL OR awareness_level IN (
    'probleme_inconscient',
    'conscient_probleme',
    'conscient_solution',
    'conscient_produit',
    'pret_acheter'
  ));
