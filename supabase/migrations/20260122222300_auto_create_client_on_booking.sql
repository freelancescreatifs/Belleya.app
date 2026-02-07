/*
  # Auto-create Client on Booking

  ## Overview
  When a client books an appointment (event with event_type='pro' and client_id),
  automatically create a client record in the clients table if it doesn't exist.

  ## Changes
  1. Create function to auto-create client from auth.users data
  2. Create trigger on events INSERT

  ## Notes
  - Only triggers for pro appointments with client_id
  - Checks if client already exists before creating
  - Uses SECURITY DEFINER to bypass RLS
  - Populates client data from user_profiles if available
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
BEGIN
  -- Only for pro appointments with client_id
  IF NEW.event_type != 'pro' OR NEW.client_id IS NULL THEN
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
      full_name,
      avatar_url,
      phone
    INTO v_user_profile
    FROM user_profiles
    WHERE id = NEW.client_id;

    -- Get email from auth.users
    DECLARE
      v_email text;
    BEGIN
      SELECT email INTO v_email
      FROM auth.users
      WHERE id = NEW.client_id;

      -- Create client record
      INSERT INTO clients (
        company_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        photo_url,
        status,
        source,
        notes
      ) VALUES (
        NEW.company_id,
        NEW.client_id,
        SPLIT_PART(COALESCE(v_user_profile.full_name, v_email, 'Client'), ' ', 1),
        NULLIF(SPLIT_PART(COALESCE(v_user_profile.full_name, ''), ' ', 2), ''),
        v_email,
        v_user_profile.phone,
        v_user_profile.avatar_url,
        'active',
        'booking',
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_create_client_on_booking ON events;
CREATE TRIGGER trigger_auto_create_client_on_booking
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_on_booking();
