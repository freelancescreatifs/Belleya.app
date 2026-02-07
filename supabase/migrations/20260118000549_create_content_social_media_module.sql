/*
  # Module Contenu & Réseaux Sociaux

  1. Nouvelles Tables
    - `content_calendar`
      - Contenus planifiés avec dates obligatoires
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `content_type` (text)
      - `platform` (text)
      - `publication_date` (date) - OBLIGATOIRE
      - `status` (text) - idea, to_produce, scheduled, published
      - `image_url` (text) - URL de l'image
      - `feed_order` (integer) - ordre dans le feed Instagram
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `marronniers`
      - Calendrier des dates importantes (fêtes, événements)
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable) - null = marronnier global
      - `date` (date)
      - `title` (text)
      - `theme` (text)
      - `industry` (text[]) - beauté, formation, général
      - `suggestions` (jsonb) - suggestions de contenus
      - `is_global` (boolean) - true = visible pour tous
      - `created_at` (timestamptz)

    - `content_alerts`
      - Alertes et conseils réseaux sociaux
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `alert_type` (text) - marronnier, tip, reminder
      - `title` (text)
      - `message` (text)
      - `related_date` (date, nullable)
      - `status` (text) - active, dismissed
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies restrictives pour chaque table
    - Marronniers globaux lisibles par tous les utilisateurs authentifiés
    - Marronniers personnalisés visibles uniquement par leur créateur

  3. Fonctionnalités
    - Planification avec dates obligatoires
    - Feed Instagram interactif avec drag & drop
    - Synchronisation bidirectionnelle Feed ↔ Calendrier
    - Calendrier des marronniers
    - Alertes automatiques avant les dates importantes
*/

-- Create content_calendar table
CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  content_type text DEFAULT 'post' CHECK (content_type IN ('reel', 'carrousel', 'post', 'story', 'video', 'live')),
  platform text DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'facebook', 'youtube', 'twitter')),
  publication_date date NOT NULL,
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'to_produce', 'scheduled', 'published')),
  image_url text DEFAULT '',
  feed_order integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content calendar"
  ON content_calendar FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content calendar"
  ON content_calendar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content calendar"
  ON content_calendar FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content calendar"
  ON content_calendar FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create marronniers table
CREATE TABLE IF NOT EXISTS marronniers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  theme text DEFAULT '',
  industry text[] DEFAULT '{}',
  suggestions jsonb DEFAULT '[]'::jsonb,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marronniers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global marronniers"
  ON marronniers FOR SELECT
  TO authenticated
  USING (is_global = true);

CREATE POLICY "Users can view own marronniers"
  ON marronniers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marronniers"
  ON marronniers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users can update own marronniers"
  ON marronniers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_global = false)
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users can delete own marronniers"
  ON marronniers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_global = false);

-- Create content_alerts table
CREATE TABLE IF NOT EXISTS content_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text DEFAULT 'tip' CHECK (alert_type IN ('marronnier', 'tip', 'reminder')),
  title text NOT NULL,
  message text NOT NULL,
  related_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content alerts"
  ON content_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content alerts"
  ON content_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content alerts"
  ON content_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content alerts"
  ON content_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert global marronniers (dates importantes françaises)
INSERT INTO marronniers (date, title, theme, industry, is_global, suggestions) VALUES
  ('2026-01-01', 'Nouvel An', 'Nouvelle annee, nouveaux objectifs', ARRAY['general'], true, '[{"title": "Bilan & Projets 2026", "type": "carrousel"}, {"title": "Mes objectifs beaute 2026", "type": "reel"}]'::jsonb),
  ('2026-02-14', 'Saint-Valentin', 'Amour, soin de soi, cadeaux', ARRAY['beauty', 'general'], true, '[{"title": "Nail art special Saint-Valentin", "type": "reel"}, {"title": "Offrez un soin beaute", "type": "post"}]'::jsonb),
  ('2026-03-08', 'Journee de la Femme', 'Empowerment, reussite feminine', ARRAY['general'], true, '[{"title": "Portrait inspirant", "type": "post"}, {"title": "Mon parcours entrepreneurial", "type": "carrousel"}]'::jsonb),
  ('2026-03-20', 'Printemps', 'Renouveau, couleurs pastels', ARRAY['beauty', 'general'], true, '[{"title": "Tendances printemps", "type": "carrousel"}, {"title": "Couleurs de saison", "type": "reel"}]'::jsonb),
  ('2026-05-01', 'Fete du Travail', 'Metier, passion, savoir-faire', ARRAY['general'], true, '[{"title": "Mon metier, ma passion", "type": "reel"}, {"title": "Coulisses du quotidien", "type": "story"}]'::jsonb),
  ('2026-05-10', 'Fete des Meres', 'Cadeaux, soins, moments', ARRAY['beauty', 'general'], true, '[{"title": "Idee cadeau Fete des Meres", "type": "post"}, {"title": "Offre speciale", "type": "carrousel"}]'::jsonb),
  ('2026-06-21', 'Ete', 'Soleil, vacances, fraicheur', ARRAY['beauty', 'general'], true, '[{"title": "Mes essentiels ete", "type": "reel"}, {"title": "Preparer sa peau pour l ete", "type": "carrousel"}]'::jsonb),
  ('2026-07-14', 'Fete Nationale', 'France, patriotisme, bleu-blanc-rouge', ARRAY['general'], true, '[{"title": "Nail art tricolore", "type": "reel"}, {"title": "Mon coin de France", "type": "post"}]'::jsonb),
  ('2026-09-01', 'Rentree', 'Organisation, nouveaux departs', ARRAY['formation', 'general'], true, '[{"title": "Rentree : mes conseils organisation", "type": "carrousel"}, {"title": "Nouveaux projets de rentree", "type": "post"}]'::jsonb),
  ('2026-09-23', 'Automne', 'Couleurs chaudes, cocooning', ARRAY['beauty', 'general'], true, '[{"title": "Tendances automne", "type": "carrousel"}, {"title": "Ambiance cosy", "type": "reel"}]'::jsonb),
  ('2026-10-31', 'Halloween', 'Creativite, nail art, deguisements', ARRAY['beauty', 'general'], true, '[{"title": "Nail art Halloween", "type": "reel"}, {"title": "Transformation spooky", "type": "video"}]'::jsonb),
  ('2026-11-27', 'Black Friday', 'Promotions, offres speciales', ARRAY['general'], true, '[{"title": "Offres Black Friday", "type": "post"}, {"title": "Mes coups de coeur promos", "type": "carrousel"}]'::jsonb),
  ('2026-12-21', 'Hiver', 'Fetes, lumieres, cocooning', ARRAY['beauty', 'general'], true, '[{"title": "Ambiance festive", "type": "reel"}, {"title": "Preparer les fetes", "type": "carrousel"}]'::jsonb),
  ('2026-12-25', 'Noel', 'Fetes, cadeaux, famille', ARRAY['beauty', 'general'], true, '[{"title": "Nail art de Noel", "type": "reel"}, {"title": "Idees cadeaux", "type": "carrousel"}]'::jsonb),
  ('2026-12-31', 'Reveillon', 'Bilan, fete, nouvelle annee', ARRAY['general'], true, '[{"title": "Bilan 2026", "type": "carrousel"}, {"title": "Mes meilleurs moments", "type": "reel"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_date ON content_calendar(user_id, publication_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_feed_order ON content_calendar(user_id, feed_order);
CREATE INDEX IF NOT EXISTS idx_marronniers_date ON marronniers(date);
CREATE INDEX IF NOT EXISTS idx_content_alerts_user_status ON content_alerts(user_id, status);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'content_calendar_updated_at'
  ) THEN
    CREATE TRIGGER content_calendar_updated_at
      BEFORE UPDATE ON content_calendar
      FOR EACH ROW
      EXECUTE FUNCTION update_content_calendar_updated_at();
  END IF;
END $$;
