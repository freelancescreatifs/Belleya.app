/*
  # Fix: Ajouter Gestion d'Erreur au Trigger handle_new_user

  ## Problème
  La fonction `handle_new_user` insère dans la table `profiles` (ancienne table)
  sans gestion d'erreur. Si l'insertion échoue, tout le signup échoue avec:
  "Database error saving new user"

  ## Solution
  Ajouter un bloc EXCEPTION WHEN OTHERS comme dans les autres fonctions trigger
  pour que l'erreur soit loguée mais ne bloque PAS le signup.

  ## Changements
  1. Modifier handle_new_user() pour ajouter gestion d'erreur
  2. La fonction continue de tenter l'insertion dans `profiles` (compatibilité)
  3. Mais en cas d'échec, le signup continue (user_profiles sera créé par l'autre trigger)
*/

-- Modifier la fonction handle_new_user pour ajouter gestion d'erreur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tenter d'insérer dans profiles (ancienne table, pour compatibilité)
  -- En cas d'erreur, ne PAS bloquer la création du user
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

    RAISE NOTICE 'profiles created successfully for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque PAS le signup
      RAISE WARNING 'Failed to create profiles for %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

-- Vérifier que le trigger existe toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'auth'
      AND trigger_name = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    
    RAISE NOTICE 'Trigger on_auth_user_created created';
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created already exists';
  END IF;
END $$;
