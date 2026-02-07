/*
  # Add Content Analytics Fields
  
  1. New Fields
    - `is_recycled` (boolean, default false) - Indique si le contenu est recyclé/dupliqué
    - `content_nature` (text) - Nature du contenu: 'valeur' ou 'promo'
    - `production_time` (text) - Temps de production estimé: 'court', 'moyen', 'long'
    - `blocking_point` (text, nullable) - Point de blocage dans la production
    - `theme` (text, nullable) - Thématique principale du contenu
    - `key_message` (text, nullable) - Message clé porté par le contenu
    - `adaptation_source` (text, nullable) - Source si adapté d'un autre format
  
  2. Purpose
    - Permettre le calcul de statistiques éditoriales détaillées
    - Suivre l'effort de production et optimiser le temps
    - Identifier les points de blocage dans le workflow
    - Analyser la répartition valeur vs promotion
*/

-- Add is_recycled field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'is_recycled'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN is_recycled boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add content_nature field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'content_nature'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN content_nature text DEFAULT 'valeur' CHECK (content_nature IN ('valeur', 'promo'));
  END IF;
END $$;

-- Add production_time field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'production_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN production_time text DEFAULT 'moyen' CHECK (production_time IN ('court', 'moyen', 'long'));
  END IF;
END $$;

-- Add blocking_point field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'blocking_point'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN blocking_point text;
  END IF;
END $$;

-- Add theme field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'theme'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN theme text;
  END IF;
END $$;

-- Add key_message field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'key_message'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN key_message text;
  END IF;
END $$;

-- Add adaptation_source field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'adaptation_source'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN adaptation_source text;
  END IF;
END $$;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_content_calendar_publication_date ON content_calendar(publication_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_content_type ON content_calendar(content_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON content_calendar(platform);
CREATE INDEX IF NOT EXISTS idx_content_calendar_objective ON content_calendar(objective);
CREATE INDEX IF NOT EXISTS idx_content_calendar_is_recycled ON content_calendar(is_recycled);
CREATE INDEX IF NOT EXISTS idx_content_calendar_content_nature ON content_calendar(content_nature);
