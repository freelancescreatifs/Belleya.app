/*
  # Système Client + Marketplace - BelleYa
  
  Ce module crée l'infrastructure complète pour:
  - Gestion des rôles (cliente/praticienne)
  - Profils publics des praticiennes
  - Système de réservation publique
  - Avis et notes
  - Favoris clientes
  - CRM automatique des clientes par praticienne

  ## 1. Nouvelles Tables
  
  ### `user_profiles`
  Extension des profils utilisateurs avec rôle et informations de base
  - `id` (uuid, primary key)
  - `user_id` (uuid, référence vers auth.users)
  - `role` (text) - 'client' ou 'pro'
  - `first_name` (text) - Prénom
  - `last_name` (text) - Nom
  - `phone` (text) - Téléphone
  - `photo_url` (text) - Photo de profil
  - `created_at`, `updated_at` (timestamptz)

  ### `pro_profiles`
  Profils publics des praticiennes pour la marketplace
  - `id` (uuid, primary key)
  - `user_id` (uuid, référence vers auth.users)
  - `slug` (text, unique) - URL publique (ex: belleya.app/booking/marie-nails)
  - `business_name` (text) - Nom professionnel/commercial
  - `profession` (text) - Métier (prothésiste ongulaire, lash artist, etc.)
  - `specialties` (text[]) - Spécialités
  - `bio` (text) - Présentation
  - `address` (text) - Adresse complète
  - `city` (text) - Ville
  - `postal_code` (text) - Code postal
  - `latitude` (decimal) - Coordonnées GPS
  - `longitude` (decimal) - Coordonnées GPS
  - `address_visible` (boolean) - Si l'adresse est publique (salon)
  - `is_salon` (boolean) - Si c'est un salon (vs domicile)
  - `is_visible` (boolean) - Visible sur la carte
  - `is_accepting_bookings` (boolean) - Accepte les réservations
  - `portfolio_photos` (text[]) - URLs des photos portfolio
  - `instagram_handle` (text)
  - `average_rating` (decimal) - Note moyenne (calculée)
  - `total_reviews` (integer) - Nombre total d'avis
  - `created_at`, `updated_at` (timestamptz)

  ### `bookings`
  Réservations de rendez-vous
  - `id` (uuid, primary key)
  - `client_id` (uuid, référence vers auth.users) - Cliente
  - `pro_id` (uuid, référence vers auth.users) - Praticienne
  - `service_id` (uuid, référence vers services)
  - `appointment_date` (timestamptz) - Date et heure du RDV
  - `duration` (integer) - Durée en minutes
  - `price` (decimal) - Prix
  - `status` (text) - pending/confirmed/completed/cancelled
  - `cancellation_reason` (text)
  - `notes` (text) - Notes de la cliente
  - `pro_notes` (text) - Notes internes de la pro
  - `created_at`, `updated_at` (timestamptz)

  ### `reviews`
  Avis des clientes sur les prestations
  - `id` (uuid, primary key)
  - `booking_id` (uuid, référence vers bookings, unique)
  - `client_id` (uuid, référence vers auth.users)
  - `pro_id` (uuid, référence vers auth.users)
  - `rating` (integer) - Note de 1 à 5
  - `comment` (text) - Commentaire
  - `tags` (text[]) - Tags rapides (accueil, propreté, etc.)
  - `is_public` (boolean) - Autorisation d'affichage public
  - `pro_response` (text) - Réponse de la praticienne
  - `is_reported` (boolean) - Si signalé comme abusif
  - `created_at`, `updated_at` (timestamptz)

  ### `favorites`
  Praticiennes favorites des clientes
  - `id` (uuid, primary key)
  - `client_id` (uuid, référence vers auth.users)
  - `pro_id` (uuid, référence vers auth.users)
  - `created_at` (timestamptz)
  - UNIQUE(client_id, pro_id)

  ### `crm_clients`
  Fiches clientes dans le CRM de chaque praticienne (auto-créées)
  - `id` (uuid, primary key)
  - `pro_id` (uuid, référence vers auth.users) - Praticienne propriétaire
  - `user_id` (uuid, référence vers auth.users, nullable) - Lié au compte cliente si elle en a un
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text)
  - `phone` (text)
  - `notes` (text) - Notes privées de la praticienne
  - `first_visit_date` (date) - Date première visite
  - `last_visit_date` (date) - Date dernière visite
  - `total_visits` (integer) - Nombre de visites
  - `total_spent` (decimal) - Total dépensé
  - `created_at`, `updated_at` (timestamptz)
  - UNIQUE(pro_id, email) - Éviter les doublons par email

  ## 2. Sécurité (RLS)
  
  Toutes les tables ont RLS activé avec des policies restrictives:
  - Les clientes voient uniquement leurs propres données
  - Les praticiennes voient uniquement leurs propres données
  - Les profils publics pros sont visibles par tous (si is_visible = true)
  - Les avis publics sont visibles par tous

  ## 3. Indexes
  
  Indexes pour optimiser les performances:
  - Recherche par slug (booking URL)
  - Recherche géographique (lat/lng)
  - Filtres par profession, ville
  - Recherche d'avis par praticienne
  - Anti-doublons CRM (email, phone)
*/

-- =============================================================================
-- 1. USER PROFILES (Extension avec rôles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('client', 'pro')),
  first_name text,
  last_name text,
  phone text,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- =============================================================================
-- 2. PRO PROFILES (Profils publics marketplace)
-- =============================================================================

CREATE TABLE IF NOT EXISTS pro_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text UNIQUE NOT NULL,
  business_name text NOT NULL,
  profession text NOT NULL,
  specialties text[] DEFAULT '{}',
  bio text,
  address text,
  city text,
  postal_code text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  address_visible boolean DEFAULT false NOT NULL,
  is_salon boolean DEFAULT false NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  is_accepting_bookings boolean DEFAULT true NOT NULL,
  portfolio_photos text[] DEFAULT '{}',
  instagram_handle text,
  average_rating decimal(3, 2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE pro_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro can view own profile"
  ON pro_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view visible pro profiles"
  ON pro_profiles FOR SELECT
  TO authenticated
  USING (is_visible = true);

CREATE POLICY "Pro can insert own profile"
  ON pro_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pro can update own profile"
  ON pro_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pro_profiles_user_id ON pro_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_slug ON pro_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_city ON pro_profiles(city);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_profession ON pro_profiles(profession);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_visible ON pro_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_location ON pro_profiles(latitude, longitude);

-- =============================================================================
-- 3. BOOKINGS (Réservations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  appointment_date timestamptz NOT NULL,
  duration integer NOT NULL,
  price decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cancellation_reason text,
  notes text,
  pro_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Pros can view bookings for their services"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE POLICY "Clients can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Pros can update bookings for their services"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pro_id ON bookings(pro_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);

-- =============================================================================
-- 4. REVIEWS (Avis)
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true NOT NULL,
  pro_response text,
  is_reported boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(booking_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Pros can view reviews for their services"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE POLICY "Public can view public reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_public = true AND is_reported = false);

CREATE POLICY "Clients can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Pros can update reviews with response"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);

CREATE INDEX IF NOT EXISTS idx_reviews_pro_id ON reviews(pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- =============================================================================
-- 5. FAVORITES (Favoris)
-- =============================================================================

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(client_id, pro_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pro_id ON favorites(pro_id);

-- =============================================================================
-- 6. CRM CLIENTS (Fiches clientes auto-créées)
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  notes text,
  first_visit_date date,
  last_visit_date date,
  total_visits integer DEFAULT 0,
  total_spent decimal(10, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(pro_id, email)
);

ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros can view own CRM clients"
  ON crm_clients FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE POLICY "Pros can insert own CRM clients"
  ON crm_clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Pros can update own CRM clients"
  ON crm_clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Pros can delete own CRM clients"
  ON crm_clients FOR DELETE
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE INDEX IF NOT EXISTS idx_crm_clients_pro_id ON crm_clients(pro_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_user_id ON crm_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_email ON crm_clients(email);
CREATE INDEX IF NOT EXISTS idx_crm_clients_phone ON crm_clients(phone);

-- =============================================================================
-- 7. FUNCTIONS - Mise à jour automatique des statistiques
-- =============================================================================

-- Fonction pour mettre à jour la note moyenne d'une praticienne
CREATE OR REPLACE FUNCTION update_pro_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pro_profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE pro_id = COALESCE(NEW.pro_id, OLD.pro_id)
        AND is_public = true
        AND is_reported = false
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE pro_id = COALESCE(NEW.pro_id, OLD.pro_id)
        AND is_public = true
        AND is_reported = false
    )
  WHERE user_id = COALESCE(NEW.pro_id, OLD.pro_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la note après insert/update/delete d'un avis
DROP TRIGGER IF EXISTS trigger_update_pro_rating ON reviews;
CREATE TRIGGER trigger_update_pro_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_pro_rating();

-- Fonction pour mettre à jour les stats CRM après un booking
CREATE OR REPLACE FUNCTION update_crm_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE crm_clients
    SET 
      last_visit_date = NEW.appointment_date::date,
      total_visits = total_visits + 1,
      total_spent = total_spent + NEW.price,
      updated_at = now()
    WHERE pro_id = NEW.pro_id
      AND (user_id = NEW.client_id OR email = (SELECT email FROM auth.users WHERE id = NEW.client_id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats CRM
DROP TRIGGER IF EXISTS trigger_update_crm_stats ON bookings;
CREATE TRIGGER trigger_update_crm_stats
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_crm_stats();
