/*
  # Ajout des préférences pour la vue Réseaux sociaux

  1. Modifications
    - Ajouter `social_media_enabled` (boolean) - Active/désactive la vue Réseaux sociaux
    - Ajouter `social_by_post_type_enabled` (boolean) - Active/désactive la vue par type de post
    - Ajouter `social_by_production_enabled` (boolean) - Active/désactive la vue par production

  2. Notes
    - Par défaut, toutes les nouvelles vues sont activées
    - Les préférences existantes sont préservées
*/

-- Ajouter les nouveaux champs pour la vue Réseaux sociaux
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_view_preferences' AND column_name = 'social_media_enabled'
  ) THEN
    ALTER TABLE content_view_preferences
    ADD COLUMN social_media_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_view_preferences' AND column_name = 'social_by_post_type_enabled'
  ) THEN
    ALTER TABLE content_view_preferences
    ADD COLUMN social_by_post_type_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_view_preferences' AND column_name = 'social_by_production_enabled'
  ) THEN
    ALTER TABLE content_view_preferences
    ADD COLUMN social_by_production_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Mettre à jour les préférences existantes pour activer par défaut
UPDATE content_view_preferences
SET
  social_media_enabled = COALESCE(social_media_enabled, true),
  social_by_post_type_enabled = COALESCE(social_by_post_type_enabled, true),
  social_by_production_enabled = COALESCE(social_by_production_enabled, true);