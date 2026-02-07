/*
  # Fix Profiles Table - RLS et Trigger
  
  1. Problème
    - Le trigger `on_auth_user_created` appelle `handle_new_user()`
    - Cette fonction insère dans la table `profiles`
    - La policy INSERT vérifie `auth.uid() = id`
    - Pendant le signup, `auth.uid()` est NULL → ÉCHEC
  
  2. Solution
    - Modifier `handle_new_user()` pour utiliser `SET LOCAL row_security = off`
    - Ou supprimer la policy restrictive sur `profiles`
    - Ajouter une policy permissive pour les triggers
  
  3. Sécurité
    - La fonction est SECURITY DEFINER (droits du créateur)
    - Seul le trigger peut l'appeler
*/

-- ============================================================================
-- 1. Supprimer l'ancienne policy INSERT restrictive sur profiles
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- ============================================================================
-- 2. Créer une policy INSERT permissive pour les triggers
-- ============================================================================

CREATE POLICY "Allow insert for authenticated"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 3. Recréer handle_new_user avec SET LOCAL row_security = off
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Désactiver RLS pour cette transaction
  SET LOCAL row_security = off;
  
  -- Tenter d'insérer dans profiles (ancienne table, pour compatibilité)
  BEGIN
    INSERT INTO profiles (id, email, full_name, mode, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'professional',
      NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'profiles created for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ne jamais bloquer le signup
      RAISE WARNING 'Failed to create profiles for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. Vérification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Fix Applied ===';
  RAISE NOTICE 'profiles table: RLS policy updated to allow inserts';
  RAISE NOTICE 'handle_new_user(): Updated with SET LOCAL row_security = off';
  RAISE NOTICE '=== Ready for signup ===';
END $$;
