/*
  # Créer table pour les préférences des vues de contenu

  1. Nouvelle table
    - `content_view_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `calendar_enabled` (boolean) - Active/désactive la vue Calendrier
      - `editorial_calendar_enabled` (boolean) - Active/désactive le calendrier éditorial
      - `production_calendar_enabled` (boolean) - Active/désactive le calendrier de production
      - `studio_enabled` (boolean) - Active/désactive le Studio de contenu
      - `type_view_enabled` (boolean) - Active/désactive la vue par type
      - `table_view_enabled` (boolean) - Active/désactive la vue par ligne
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS
    - Les utilisateurs peuvent seulement voir/modifier leurs propres préférences
*/

CREATE TABLE IF NOT EXISTS content_view_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_enabled boolean DEFAULT true,
  editorial_calendar_enabled boolean DEFAULT true,
  production_calendar_enabled boolean DEFAULT true,
  studio_enabled boolean DEFAULT true,
  type_view_enabled boolean DEFAULT true,
  table_view_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE content_view_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON content_view_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON content_view_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON content_view_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Créer les préférences par défaut pour tous les utilisateurs existants
INSERT INTO content_view_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_content_view_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_view_preferences_updated_at_trigger
  BEFORE UPDATE ON content_view_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_content_view_preferences_updated_at();

-- Trigger pour créer automatiquement les préférences lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION create_default_content_view_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_view_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_content_view_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_content_view_preferences();
