/*
  # Piliers éditoriaux et contenus enrichis

  1. Nouvelle Table
    - `editorial_pillars`
      - Piliers éditoriaux personnalisés par métier/utilisateur
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `profession_type` (text) - nail_artist, esthetician, hairdresser, makeup_artist, etc.
      - `pillar_name` (text) - Nom du pilier (ex: "Techniques & tenue", "Erreurs clientes")
      - `color` (text) - Couleur hex pour l'affichage
      - `is_active` (boolean) - Pilier actif ou non
      - `created_at` (timestamptz)

  2. Modifications de content_calendar
    - Ajout de `editorial_pillar` (text) - Pilier éditorial sélectionné
    - Ajout de `angle` (text) - Angle précis du contenu
    - Ajout de `enriched_title` (text) - Titre enrichi pour vue mois
    - Ajout de `objective` (text) - attirer, éduquer, convertir, fidéliser

  3. Sécurité
    - Enable RLS sur editorial_pillars
    - Policies restrictives par utilisateur

  4. Notes importantes
    - Les piliers sont personnalisables par profession
    - Chaque utilisateur peut ajouter ses propres piliers
    - Les piliers par défaut sont créés automatiquement selon la profession
*/

-- Create editorial_pillars table
CREATE TABLE IF NOT EXISTS editorial_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profession_type text NOT NULL,
  pillar_name text NOT NULL,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE editorial_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own editorial pillars"
  ON editorial_pillars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own editorial pillars"
  ON editorial_pillars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own editorial pillars"
  ON editorial_pillars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own editorial pillars"
  ON editorial_pillars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add new columns to content_calendar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'editorial_pillar'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN editorial_pillar text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'angle'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN angle text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'enriched_title'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN enriched_title text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'objective'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN objective text DEFAULT 'attirer' CHECK (objective IN ('attirer', 'éduquer', 'convertir', 'fidéliser'));
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_editorial_pillars_user ON editorial_pillars(user_id, profession_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_pillar ON content_calendar(user_id, editorial_pillar);

-- Function to create default pillars based on profession
CREATE OR REPLACE FUNCTION create_default_editorial_pillars(
  p_user_id uuid,
  p_profession_type text
)
RETURNS void AS $$
BEGIN
  -- Nail Artist pillars
  IF p_profession_type = 'nail_artist' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Techniques & tenue', '#EC4899'),
      (p_user_id, p_profession_type, 'Erreurs clientes', '#F59E0B'),
      (p_user_id, p_profession_type, 'Hygiène ongles', '#10B981'),
      (p_user_id, p_profession_type, 'Tendances ongles', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Relation cliente', '#3B82F6'),
      (p_user_id, p_profession_type, 'Prix & respect', '#EF4444')
    ON CONFLICT DO NOTHING;
  
  -- Esthéticienne / Skincare pillars
  ELSIF p_profession_type = 'esthetician' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Types de peau', '#EC4899'),
      (p_user_id, p_profession_type, 'Erreurs skincare', '#F59E0B'),
      (p_user_id, p_profession_type, 'Routine & constance', '#10B981'),
      (p_user_id, p_profession_type, 'Mythes beauté', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Résultats long terme', '#3B82F6')
    ON CONFLICT DO NOTHING;
  
  -- Coiffeuse pillars
  ELSIF p_profession_type = 'hairdresser' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Diagnostic cheveux', '#EC4899'),
      (p_user_id, p_profession_type, 'Avant / Après', '#F59E0B'),
      (p_user_id, p_profession_type, 'Entretien à domicile', '#10B981'),
      (p_user_id, p_profession_type, 'Tendances coupe/couleur', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Erreurs fréquentes', '#3B82F6')
    ON CONFLICT DO NOTHING;
  
  -- Maquilleuse pillars
  ELSIF p_profession_type = 'makeup_artist' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Techniques makeup', '#EC4899'),
      (p_user_id, p_profession_type, 'Tendances makeup', '#F59E0B'),
      (p_user_id, p_profession_type, 'Erreurs fréquentes', '#10B981'),
      (p_user_id, p_profession_type, 'Produits essentiels', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Looks & occasions', '#3B82F6')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;
