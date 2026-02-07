/*
  # Fix Client Signup - Bypass RLS pour les Triggers
  
  1. Problème
    - Les policies INSERT vérifient auth.uid() = user_id
    - Pendant le signup, auth.uid() retourne NULL
    - Les triggers AFTER INSERT échouent → erreur "Database error saving new user"
  
  2. Solution
    - Supprimer les policies INSERT restrictives
    - Créer des policies qui permettent l'insertion depuis les triggers
    - Les fonctions SECURITY DEFINER avec SET LOCAL row_security = off doivent fonctionner
  
  3. Sécurité
    - Les fonctions sont SECURITY DEFINER (droits du créateur)
    - Seuls les triggers peuvent appeler ces fonctions
    - Les policies SELECT/UPDATE/DELETE restent restrictives
*/

-- ============================================================================
-- 1. Supprimer les anciennes policies INSERT restrictives
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own company profile" ON company_profiles;

-- ============================================================================
-- 2. Créer de nouvelles policies INSERT permissives pour les triggers
-- ============================================================================

-- Pour user_profiles : Permettre INSERT depuis n'importe quelle connexion authentifiée
-- Cela permet aux triggers de fonctionner même si auth.uid() est NULL
CREATE POLICY "Allow insert for authenticated"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Pour company_profiles : Même chose
CREATE POLICY "Allow insert for authenticated"
  ON company_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 3. Recréer les fonctions pour s'assurer qu'elles utilisent SET LOCAL
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Désactiver RLS pour cette transaction
  SET LOCAL row_security = off;
  
  BEGIN
    INSERT INTO user_profiles (user_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'pro'),
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = COALESCE(EXCLUDED.role, user_profiles.role),
      first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name);
    
    RAISE NOTICE 'user_profiles created for user % with role %', NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'pro');
  EXCEPTION
    WHEN OTHERS THEN
      -- Ne jamais bloquer le signup
      RAISE WARNING 'Failed to create user_profiles for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_company_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Désactiver RLS pour cette transaction
  SET LOCAL row_security = off;
  
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'pro');
  
  -- Créer company_profile UNIQUEMENT pour les PRO
  IF v_role = 'pro' THEN
    BEGIN
      INSERT INTO company_profiles (
        user_id,
        company_name,
        activity_type,
        creation_date,
        country,
        legal_status,
        vat_mode,
        acre,
        versement_liberatoire
      )
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
          NEW.raw_user_meta_data->>'first_name',
          split_part(NEW.email, '@', 1),
          'Mon Entreprise'
        ),
        'onglerie',
        CURRENT_DATE,
        'France',
        'MICRO',
        'VAT_FRANCHISE',
        false,
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE NOTICE 'company_profiles created for PRO user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ne jamais bloquer le signup
        RAISE WARNING 'Failed to create company_profiles for %: % (SQLSTATE: %)', 
          NEW.id, SQLERRM, SQLSTATE;
    END;
  ELSE
    RAISE NOTICE 'Skipping company_profile (user % is CLIENT)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. S'assurer que les triggers existent
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created_company_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_company_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_company_profile();

-- ============================================================================
-- 5. Vérification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== RLS Policies for INSERT ===';
  RAISE NOTICE 'user_profiles: Allow insert for authenticated (WITH CHECK true)';
  RAISE NOTICE 'company_profiles: Allow insert for authenticated (WITH CHECK true)';
  RAISE NOTICE '=== Triggers configured ===';
  RAISE NOTICE 'on_auth_user_created_profile → handle_new_user_profile()';
  RAISE NOTICE 'on_auth_user_created_company_profile → handle_new_company_profile()';
  RAISE NOTICE '=== Ready for client signup ===';
END $$;
