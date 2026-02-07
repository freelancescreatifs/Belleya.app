/*
  # Ajout des champs pour la génération IA de contenu

  1. Nouveaux champs
    - `publication_time` : heure de publication (format HH:MM)
    - `caption` : texte final prêt à poster (caption Instagram, texte LinkedIn, etc.)
    - `hashtags` : hashtags générés ou modifiés par l'utilisateur
    - `content_structure` : structure détaillée du contenu (slides pour carrousel, sections pour reel, etc.)

  2. Modifications
    - `description` renommé conceptuellement pour devenir le texte de travail/structure interne
    - `notes` reste pour les notes internes (angle, CTA, etc.)

  3. Notes importantes
    - Tous les champs sont optionnels sauf ceux déjà requis
    - `publication_time` par défaut à '12:00' pour faciliter la planification
    - Les champs existants ne sont pas modifiés pour préserver les données
*/

-- Ajout du champ heure de publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'publication_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN publication_time text DEFAULT '12:00';
  END IF;
END $$;

-- Ajout du champ caption (texte final prêt à poster)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'caption'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN caption text;
  END IF;
END $$;

-- Ajout du champ hashtags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN hashtags text;
  END IF;
END $$;

-- Ajout du champ structure de contenu (pour carrousels, reels, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'content_structure'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN content_structure text;
  END IF;
END $$;
