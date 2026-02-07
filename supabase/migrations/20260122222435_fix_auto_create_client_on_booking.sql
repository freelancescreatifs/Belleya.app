/*
  # Fix Auto-create Client on Booking

  ## Overview
  Fix the auto-create client trigger to use correct schema.
  The clients table uses user_id to link to the provider (not company_id).

  ## Changes
  - Update function to check and insert using user_id (provider) instead of company_id
  - Fix the unique constraint check
*/

-- Function to auto-create client when booking is made
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
BEGIN
  -- Only for pro appointments with client_id
  IF NEW.event_type != 'pro' OR NEW.client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if client already exists for this provider
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE user_id = NEW.user_id
    AND id = NEW.client_id
  ) INTO v_client_exists;

  -- If client doesn't exist, create it
  IF NOT v_client_exists THEN
    -- Get user profile data for the client
    SELECT
      full_name,
      avatar_url,
      phone
    INTO v_user_profile
    FROM user_profiles
    WHERE id = NEW.client_id;

    -- Get email from auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = NEW.client_id;

    -- Create client record
    BEGIN
      INSERT INTO clients (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        photo_url,
        status,
        notes
      ) VALUES (
        NEW.user_id,  -- Provider's user_id
        SPLIT_PART(COALESCE(v_user_profile.full_name, v_email, 'Client'), ' ', 1),
        NULLIF(SPLIT_PART(COALESCE(v_user_profile.full_name, ''), ' ', 2), ''),
        v_email,
        v_user_profile.phone,
        v_user_profile.avatar_url,
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
