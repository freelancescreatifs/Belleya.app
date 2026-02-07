/*
  # Ajout des champs pour le profil personnel

  1. Nouveaux champs
    - `profile_photo` (text) - URL de la photo de profil
    - `bio` (text) - Biographie/présentation
    - `address` (text) - Adresse postale complète
    - `diplomas` (jsonb) - Liste des diplômes [{ id, name, year }]
    - `institute_photos` (jsonb) - Photos de l'institut [{ id, url, order }]
    - `weekly_availability` (jsonb) - Horaires hebdomadaires { monday: [{start, end, available}], ... }
    - `conditions` (jsonb) - Conditions d'acceptation [{ id, text, createdAt }]
    - `allow_companion` (boolean) - Autoriser accompagnant
    - `max_companions` (integer) - Nombre max d'accompagnants
    - `stripe_account_id` (text) - ID compte Stripe connecté
    - `stripe_connected` (boolean) - Statut connexion Stripe
    - `paypal_email` (text) - Email PayPal connecté
    - `paypal_connected` (boolean) - Statut connexion PayPal

  2. Sécurité
    - Les champs sont accessibles par l'utilisateur propriétaire
    - Les champs publics (photo, bio, horaires, conditions) sont visibles par tous
*/

-- Ajouter les nouveaux champs au profil
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS profile_photo text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS diplomas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS institute_photos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weekly_availability jsonb DEFAULT '{
    "monday": [],
    "tuesday": [],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [],
    "sunday": []
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_companion boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_companions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS paypal_email text,
  ADD COLUMN IF NOT EXISTS paypal_connected boolean DEFAULT false;

-- Créer le bucket pour les photos de profil si non existant
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-photos', 'profile-photos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Créer le bucket pour les photos d'institut si non existant
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('institute-photos', 'institute-photos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Politique de stockage pour les photos de profil
DROP POLICY IF EXISTS "Users can upload their profile photo" ON storage.objects;
CREATE POLICY "Users can upload their profile photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their profile photo" ON storage.objects;
CREATE POLICY "Users can update their profile photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their profile photo" ON storage.objects;
CREATE POLICY "Users can delete their profile photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Profile photos are publicly accessible" ON storage.objects;
CREATE POLICY "Profile photos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

-- Politique de stockage pour les photos d'institut
DROP POLICY IF EXISTS "Users can upload institute photos" ON storage.objects;
CREATE POLICY "Users can upload institute photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'institute-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update institute photos" ON storage.objects;
CREATE POLICY "Users can update institute photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'institute-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete institute photos" ON storage.objects;
CREATE POLICY "Users can delete institute photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'institute-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Institute photos are publicly accessible" ON storage.objects;
CREATE POLICY "Institute photos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'institute-photos');