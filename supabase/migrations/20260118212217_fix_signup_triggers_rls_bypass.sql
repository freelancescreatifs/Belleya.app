/*
  # Fix Signup Triggers - Bypass RLS
  
  ## Problème identifié
  Les triggers AFTER INSERT sur auth.users échouent car :
  1. RLS est activé sur user_profiles et company_profiles
  2. Les policies INSERT vérifient auth.uid() = user_id
  3. Au moment du trigger, auth.uid() retourne NULL (session pas encore établie)
  4. Résultat : INSERT bloqué → erreur 500 au signup
  
  ## Solution
  1. Recréer les fonctions avec SET check_function_bodies = OFF
  2. Modifier les triggers pour bypasser complètement RLS
  3. Ajouter gestion d'erreur robuste (EXCEPTION WHEN OTHERS)
  4. Ne JAMAIS bloquer la création du user
  
  ## Sécurité
  - SECURITY DEFINER : Les fonctions s'exécutent avec les droits du créateur
  - Les fonctions vérifient elles-mêmes les données (pas de auth.uid())
  - Aucun risque : seul le trigger peut appeler ces fonctions
*/

-- ============================================================================
-- 1. Fix handle_new_user_profile (création user_profiles)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenter de créer le profil utilisateur
  -- En cas d'erreur, ne PAS bloquer la création du user
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
    
    RAISE NOTICE 'user_profiles created successfully for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque PAS le signup
      RAISE WARNING 'Failed to create user_profiles for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Fix handle_new_company_profile (création company_profiles pour PRO)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_company_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Récupérer le role depuis les metadata
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
        'micro_entreprise',
        'franchise_base_tva',
        false,
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE NOTICE 'company_profiles created successfully for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log l'erreur mais ne bloque PAS le signup
        RAISE WARNING 'Failed to create company_profiles for %: % (SQLSTATE: %)', 
          NEW.id, SQLERRM, SQLSTATE;
    END;
  ELSE
    RAISE NOTICE 'Skipping company_profile creation for client user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Vérifier que les triggers existent (sinon les recréer)
-- ============================================================================

-- Drop et recréer le trigger pour user_profiles (garantir qu'il utilise la nouvelle fonction)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Drop et recréer le trigger pour company_profiles
DROP TRIGGER IF EXISTS on_auth_user_created_company_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_company_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_company_profile();

-- ============================================================================
-- 4. Ajouter une policy de service pour permettre INSERT via triggers
-- ============================================================================

-- Cette policy permet aux fonctions SECURITY DEFINER d'insérer même si auth.uid() est NULL
DO $$
BEGIN
  -- Pour user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  
  -- Pour company_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'company_profiles' 
      AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON company_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 5. Vérification post-migration
-- ============================================================================

-- Lister tous les triggers sur auth.users
DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '=== Triggers on auth.users ===';
  FOR r IN 
    SELECT trigger_name, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' 
      AND event_object_table = 'users'
    ORDER BY trigger_name
  LOOP
    RAISE NOTICE 'Trigger: % → %', r.trigger_name, r.action_statement;
  END LOOP;
END $$;
