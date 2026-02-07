/*
  # Ajout du profil Instagram aux company_profiles

  1. Modifications
    - Ajout de champs au profil de l'entreprise :
      - `instagram_profile_photo` (text) : URL de la photo de profil Instagram
      - `instagram_username` (text) : Nom d'utilisateur Instagram
      - `instagram_bio` (text) : Biographie Instagram
      - `instagram_website` (text) : Site web affiché sur le profil

  2. Notes
    - Ces champs permettront d'afficher un header de profil réaliste dans le feed Instagram
    - Les uploads de photos utiliseront le storage Supabase existant
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_profile_photo'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_profile_photo text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_username'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_bio'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_website'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_website text;
  END IF;
END $$;
