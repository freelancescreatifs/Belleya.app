/*
  # Fix auto_create_client_on_booking - Utiliser "type" au lieu de "event_type"

  ## Problème
  La fonction `auto_create_client_on_booking()` utilise `NEW.event_type` mais la colonne s'appelle `type` dans la table events.
  Cela cause l'erreur: "record "new" has no field "event_type""

  ## Solution
  - Remplacer `NEW.event_type` par `NEW.type`
  - Garder la même logique
*/

CREATE OR REPLACE FUNCTION auto_create_client_on_booking()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_exists boolean;
  v_user_profile record;
  v_email text;
  v_first_name text;
  v_last_name text;
BEGIN
  -- Only for pro appointments with client_id
  -- ✅ Utiliser NEW.type au lieu de NEW.event_type
  IF NEW.type != 'pro' OR NEW.client_id IS NULL OR NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if client already exists for this company
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE company_id = NEW.company_id
    AND user_id = NEW.client_id
  ) INTO v_client_exists;

  -- If client doesn't exist, create it
  IF NOT v_client_exists THEN
    -- Get user profile data
    SELECT
      first_name,
      last_name,
      phone
    INTO v_user_profile
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    -- Get email from auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = NEW.client_id;

    -- Préparer les noms
    v_first_name := COALESCE(v_user_profile.first_name, SPLIT_PART(v_email, '@', 1), 'Client');
    v_last_name := COALESCE(v_user_profile.last_name, '');

    -- Create client record
    BEGIN
      INSERT INTO clients (
        company_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status,
        notes
      ) VALUES (
        NEW.company_id,
        NEW.client_id,
        v_first_name,
        v_last_name,
        COALESCE(v_email, ''),
        v_user_profile.phone,
        'regular',
        'Client créé automatiquement lors de la prise de rendez-vous'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the booking
        RAISE WARNING 'Failed to create client: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_create_client_on_booking ON events;
CREATE TRIGGER trigger_auto_create_client_on_booking
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_on_booking();
