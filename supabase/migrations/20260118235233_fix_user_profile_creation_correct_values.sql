/*
  # Fix User Profile Auto-Creation - Bonnes Valeurs
  
  ## Problem
  1. Les triggers utilisent les mauvaises valeurs pour legal_status et vat_mode
  2. legal_status doit être: 'MICRO', 'EI', 'SASU_EURL', 'OTHER'
  3. vat_mode doit être: 'VAT_FRANCHISE' ou 'VAT_LIABLE'
  
  ## Solution
  Recréer les fonctions avec les bonnes valeurs
*/

-- ============================================================================
-- 1. Recréer handle_new_user_profile avec bypass RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    
    RAISE NOTICE 'user_profiles created successfully for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user_profiles for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Recréer handle_new_company_profile avec bypass RLS et bonnes valeurs
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
  SET LOCAL row_security = off;
  
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'pro');
  
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
      
      RAISE NOTICE 'company_profiles created successfully for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
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
-- 3. Supprimer les policies redondantes
-- ============================================================================

DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON company_profiles;

-- ============================================================================
-- 4. Réparer les utilisateurs existants sans profil
-- ============================================================================

DO $$
DECLARE
  r record;
  v_role text;
  v_count int := 0;
BEGIN
  RAISE NOTICE '=== Fixing users without profiles ===';
  
  FOR r IN 
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data->>'role' as meta_role,
      u.raw_user_meta_data->>'first_name' as first_name,
      u.raw_user_meta_data->>'last_name' as last_name
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE up.user_id IS NULL
  LOOP
    v_role := COALESCE(r.meta_role, 'pro');
    v_count := v_count + 1;
    
    INSERT INTO user_profiles (user_id, role, first_name, last_name)
    VALUES (r.id, v_role, r.first_name, r.last_name)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Created user_profile for % (role: %)', r.email, v_role;
    
    IF v_role = 'pro' THEN
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
        r.id,
        COALESCE(
          r.first_name || ' ' || r.last_name,
          r.first_name,
          split_part(r.email, '@', 1),
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
      
      RAISE NOTICE 'Created company_profile for %', r.email;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== Fixed % users ===', v_count;
END $$;
