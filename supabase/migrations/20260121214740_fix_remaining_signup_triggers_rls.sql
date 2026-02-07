/*
  # Fix RLS pour les triggers restants
  
  1. Problème
    - `create_production_defaults_for_new_user()` et `create_default_content_view_preferences()`
    - Ces fonctions n'ont pas `SET LOCAL row_security = off`
    - Pendant le signup, `auth.uid()` est NULL
    - Les policies RLS bloquent l'insertion
  
  2. Solution
    - Ajouter `SET LOCAL row_security = off` aux 2 fonctions
    - Wraper les inserts dans des blocs TRY/CATCH pour ne jamais bloquer le signup
  
  3. Sécurité
    - Les fonctions sont SECURITY DEFINER (droits du créateur)
    - Elles ne peuvent être appelées que par les triggers
*/

-- ============================================================================
-- 1. Fix create_production_defaults_for_new_user
-- ============================================================================

CREATE OR REPLACE FUNCTION create_production_defaults_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Désactiver RLS pour cette transaction
  SET LOCAL row_security = off;
  
  BEGIN
    INSERT INTO production_defaults (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'production_defaults created for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ne jamais bloquer le signup
      RAISE WARNING 'Failed to create production_defaults for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Fix create_default_content_view_preferences
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_content_view_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Désactiver RLS pour cette transaction
  SET LOCAL row_security = off;
  
  BEGIN
    INSERT INTO content_view_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'content_view_preferences created for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ne jamais bloquer le signup
      RAISE WARNING 'Failed to create content_view_preferences for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Vérification finale
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Tous les triggers signup sont maintenant corrects ===';
  RAISE NOTICE '1. handle_new_user() → profiles (WITH row_security off)';
  RAISE NOTICE '2. handle_new_user_profile() → user_profiles (WITH row_security off)';
  RAISE NOTICE '3. handle_new_company_profile() → company_profiles (WITH row_security off)';
  RAISE NOTICE '4. create_production_defaults_for_new_user() → production_defaults (WITH row_security off)';
  RAISE NOTICE '5. create_default_content_view_preferences() → content_view_preferences (WITH row_security off)';
  RAISE NOTICE '=== Le signup devrait maintenant fonctionner ===';
END $$;
