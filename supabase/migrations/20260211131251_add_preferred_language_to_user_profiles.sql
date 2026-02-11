/*
  # Add Preferred Language to User Profiles

  1. Changes
    - Add `preferred_language` column to `user_profiles` table
      - Stores user's preferred language for the application
      - Default: 'fr' (French)
      - Supported values: 'fr', 'en'
    
  2. Notes
    - Language preference is saved per user
    - Will be used to load the correct language on login
    - Falls back to browser language detection if not set
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN preferred_language text DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en'));
  END IF;
END $$;
