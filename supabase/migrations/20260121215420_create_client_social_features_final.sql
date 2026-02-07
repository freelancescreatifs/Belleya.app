/*
  # Partie CLIENT - Système social complet (follows, likes, avis, feed)
  
  1. Nouvelles tables
    - `provider_follows` : système d'abonnement aux prestataires
    - `content_likes` : likes sur les photos/contenus
    - `provider_reviews` : avis clients sur les prestataires
    
  2. Extensions des tables existantes
    - Ajout de `latitude`, `longitude`, `city`, `postal_code` à `company_profiles`
    - Ajout de `is_accepting_bookings` à `company_profiles`
    - Ajout de localisation à `user_profiles` (pour géolocalisation cliente)
    
  3. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour lecture publique des profils prestataires
    - Policies pour actions authentifiées (follow, like, avis)
*/

-- ============================================================================
-- 1. Ajouter la géolocalisation aux profils
-- ============================================================================

DO $$
BEGIN
  -- Ajouter les colonnes manquantes à company_profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'latitude') THEN
    ALTER TABLE company_profiles ADD COLUMN latitude numeric(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'longitude') THEN
    ALTER TABLE company_profiles ADD COLUMN longitude numeric(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'city') THEN
    ALTER TABLE company_profiles ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE company_profiles ADD COLUMN postal_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = 'is_accepting_bookings') THEN
    ALTER TABLE company_profiles ADD COLUMN is_accepting_bookings boolean DEFAULT true;
  END IF;
  
  -- Ajouter localisation cliente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'latitude') THEN
    ALTER TABLE user_profiles ADD COLUMN latitude numeric(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'longitude') THEN
    ALTER TABLE user_profiles ADD COLUMN longitude numeric(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'city') THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'allow_geolocation') THEN
    ALTER TABLE user_profiles ADD COLUMN allow_geolocation boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 2. Table follows (abonnements aux prestataires)
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, provider_id)
);

CREATE INDEX IF NOT EXISTS provider_follows_client_idx ON provider_follows(client_id);
CREATE INDEX IF NOT EXISTS provider_follows_provider_idx ON provider_follows(provider_id);
CREATE INDEX IF NOT EXISTS provider_follows_created_at_idx ON provider_follows(created_at DESC);

ALTER TABLE provider_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON provider_follows;
CREATE POLICY "Anyone can view follows"
  ON provider_follows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can follow providers" ON provider_follows;
CREATE POLICY "Users can follow providers"
  ON provider_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can unfollow" ON provider_follows;
CREATE POLICY "Users can unfollow"
  ON provider_follows FOR DELETE TO authenticated USING (auth.uid() = client_id);

-- ============================================================================
-- 3. Table content_likes (likes sur photos/contenus)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('client_photo', 'content_calendar', 'inspiration')),
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS content_likes_user_idx ON content_likes(user_id);
CREATE INDEX IF NOT EXISTS content_likes_content_idx ON content_likes(content_type, content_id);
CREATE INDEX IF NOT EXISTS content_likes_created_at_idx ON content_likes(created_at DESC);

ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON content_likes;
CREATE POLICY "Anyone can view likes"
  ON content_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can like content" ON content_likes;
CREATE POLICY "Users can like content"
  ON content_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike content" ON content_likes;
CREATE POLICY "Users can unlike content"
  ON content_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Table provider_reviews (avis clients)
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, booking_id)
);

CREATE INDEX IF NOT EXISTS provider_reviews_provider_idx ON provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS provider_reviews_client_idx ON provider_reviews(client_id);
CREATE INDEX IF NOT EXISTS provider_reviews_rating_idx ON provider_reviews(rating);
CREATE INDEX IF NOT EXISTS provider_reviews_created_at_idx ON provider_reviews(created_at DESC);

ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view visible reviews" ON provider_reviews;
CREATE POLICY "Anyone can view visible reviews"
  ON provider_reviews FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Clients can view their own reviews" ON provider_reviews;
CREATE POLICY "Clients can view their own reviews"
  ON provider_reviews FOR SELECT TO authenticated USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Providers can view reviews about them" ON provider_reviews;
CREATE POLICY "Providers can view reviews about them"
  ON provider_reviews FOR SELECT TO authenticated USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Clients can create reviews" ON provider_reviews;
CREATE POLICY "Clients can create reviews"
  ON provider_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update own reviews" ON provider_reviews;
CREATE POLICY "Clients can update own reviews"
  ON provider_reviews FOR UPDATE TO authenticated 
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Providers can hide reviews" ON provider_reviews;
CREATE POLICY "Providers can hide reviews"
  ON provider_reviews FOR UPDATE TO authenticated 
  USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id AND is_visible IS NOT NULL);

-- ============================================================================
-- 5. Vues pour faciliter les requêtes
-- ============================================================================

CREATE OR REPLACE VIEW provider_stats AS
SELECT 
  p.user_id as provider_id,
  COUNT(DISTINCT f.client_id) as followers_count,
  COUNT(DISTINCT r.id) as reviews_count,
  COALESCE(AVG(r.rating), 0) as average_rating
FROM company_profiles p
LEFT JOIN provider_follows f ON f.provider_id = p.user_id
LEFT JOIN provider_reviews r ON r.provider_id = p.user_id AND r.is_visible = true
GROUP BY p.user_id;

CREATE OR REPLACE VIEW public_provider_profiles AS
SELECT 
  cp.user_id,
  cp.company_name,
  cp.activity_type,
  cp.latitude,
  cp.longitude,
  cp.address,
  cp.city,
  cp.postal_code,
  cp.country,
  cp.is_accepting_bookings,
  cp.booking_slug,
  cp.profile_photo,
  cp.bio,
  up.first_name,
  up.last_name,
  ps.followers_count,
  ps.reviews_count,
  ps.average_rating
FROM company_profiles cp
JOIN user_profiles up ON up.user_id = cp.user_id
LEFT JOIN provider_stats ps ON ps.provider_id = cp.user_id
WHERE up.role = 'pro';

-- ============================================================================
-- 6. Fonction de calcul de distance (pour proximité)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric
) RETURNS numeric AS $$
DECLARE
  earth_radius numeric := 6371;
  d_lat numeric; d_lon numeric; a numeric; c numeric;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  d_lat := radians(lat2 - lat1);
  d_lon := radians(lon2 - lon1);
  a := sin(d_lat / 2) ^ 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ^ 2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. Trigger pour updated_at sur reviews
-- ============================================================================

CREATE OR REPLACE FUNCTION update_provider_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_provider_reviews_updated_at_trigger ON provider_reviews;
CREATE TRIGGER update_provider_reviews_updated_at_trigger
  BEFORE UPDATE ON provider_reviews FOR EACH ROW
  EXECUTE FUNCTION update_provider_reviews_updated_at();

-- ============================================================================
-- 8. Notifications
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Partie CLIENT - Système social créé ===';
  RAISE NOTICE '✅ Géolocalisation ajoutée';
  RAISE NOTICE '✅ provider_follows créé';
  RAISE NOTICE '✅ content_likes créé';
  RAISE NOTICE '✅ provider_reviews créé';
  RAISE NOTICE '✅ Vues et fonctions créées';
  RAISE NOTICE '=== Prêt pour le feed social ===';
END $$;
