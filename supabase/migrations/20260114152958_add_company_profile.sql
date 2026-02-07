-- Module Profil d'Entreprise
--
-- 1. Nouvelle Table: company_profiles
--   - id (uuid, primary key)
--   - user_id (uuid, référence vers auth.users)
--   - company_name (text) - Nom de l'entreprise
--   - activity_type (text) - Type d'activité
--   - creation_date (date) - Date de création de l'entreprise
--   - country (text) - Pays
--   - legal_status (text) - Statut juridique
--   - tax_regime (text) - Régime fiscal
--   - has_accre (boolean) - Si bénéficie de l'ACCRE
--   - vat_enabled (boolean) - Si assujetti à la TVA
--   - liberatory_payment (boolean) - Versement libératoire
--   - activity_category (text) - BIC ou BNC
--   - created_at, updated_at (timestamptz)
--
-- 2. Nouvelle Table: tax_thresholds
--   - Stocke les seuils fiscaux par statut
--
-- 3. Nouvelle Table: educational_content
--   - Contenus pédagogiques pour chaque statut
--
-- 4. Nouvelle Table: alerts
--   - Alertes personnalisées par utilisateur
--
-- 5. Sécurité
--   - RLS activé sur toutes les tables
--   - Policies restrictives par utilisateur

-- Table: company_profiles
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  activity_type text NOT NULL,
  creation_date date NOT NULL,
  country text DEFAULT 'France' NOT NULL,
  legal_status text NOT NULL CHECK (legal_status IN ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl', 'autre')),
  tax_regime text,
  has_accre boolean DEFAULT false,
  vat_enabled boolean DEFAULT false,
  liberatory_payment boolean DEFAULT false,
  activity_category text CHECK (activity_category IN ('BIC', 'BNC', NULL)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table: tax_thresholds
CREATE TABLE IF NOT EXISTS tax_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_status text NOT NULL,
  threshold_type text NOT NULL,
  threshold_value numeric NOT NULL,
  description text NOT NULL,
  year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tax_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tax thresholds are publicly readable"
  ON tax_thresholds FOR SELECT
  TO authenticated
  USING (true);

-- Table: educational_content
CREATE TABLE IF NOT EXISTS educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  legal_statuses text[] DEFAULT '{}',
  icon text,
  link_text text,
  link_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educational content is publicly readable"
  ON educational_content FOR SELECT
  TO authenticated
  USING (true);

-- Table: alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read boolean DEFAULT false,
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default tax thresholds for 2024-2025
INSERT INTO tax_thresholds (legal_status, threshold_type, threshold_value, description, year) VALUES
  ('auto_entreprise', 'vat_services', 36800, 'Seuil de franchise en base TVA pour prestations de services', 2024),
  ('auto_entreprise', 'vat_goods', 91900, 'Seuil de franchise en base TVA pour vente de marchandises', 2024),
  ('auto_entreprise', 'revenue_services', 77700, 'Plafond de chiffre d''affaires pour prestations de services', 2024),
  ('auto_entreprise', 'revenue_goods', 188700, 'Plafond de chiffre d''affaires pour vente de marchandises', 2024)
ON CONFLICT DO NOTHING;

-- Insert default educational content
INSERT INTO educational_content (title, content, category, legal_statuses, icon) VALUES
  (
    'Auto-entreprise : comment sont calculées vos charges ?',
    'En tant qu''auto-entrepreneur, vos charges sociales sont calculées directement sur votre chiffre d''affaires encaissé. Les taux varient selon votre activité : environ 21,2% pour les prestations de services, 12,3% pour la vente de marchandises.',
    'charges',
    ARRAY['auto_entreprise'],
    'Calculator'
  ),
  (
    'TVA : quand devez-vous la facturer ?',
    'Si vous êtes en franchise en base de TVA, vous ne facturez pas de TVA à vos clients. Attention : dès que vous dépassez les seuils (36 800€ pour les services, 91 900€ pour les biens), vous devez facturer la TVA.',
    'tva',
    ARRAY['auto_entreprise', 'entreprise_individuelle'],
    'Receipt'
  ),
  (
    'BIC ou BNC : quelle différence ?',
    'BIC (Bénéfices Industriels et Commerciaux) concerne les activités commerciales et artisanales. BNC (Bénéfices Non Commerciaux) concerne les activités libérales comme les prestations intellectuelles. Cela impacte votre régime fiscal.',
    'impots',
    ARRAY['auto_entreprise', 'entreprise_individuelle'],
    'FileText'
  ),
  (
    'CFE : à quoi sert-elle et quand la payer ?',
    'La Cotisation Foncière des Entreprises (CFE) est un impôt local dû par toutes les entreprises. Elle est généralement payable en décembre. Vous en êtes exonéré la première année d''activité.',
    'impots',
    ARRAY['auto_entreprise', 'entreprise_individuelle', 'sasu_eurl'],
    'Building'
  ),
  (
    'L''ACCRE : qu''est-ce que c''est ?',
    'L''ACCRE (maintenant ACRE) permet de bénéficier d''une réduction de charges sociales pendant vos premières années d''activité. Si vous en bénéficiez, vos taux de cotisations sont réduits progressivement sur 3 ans.',
    'charges',
    ARRAY['auto_entreprise'],
    'TrendingDown'
  )
ON CONFLICT DO NOTHING;