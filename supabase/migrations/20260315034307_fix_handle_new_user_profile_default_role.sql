/*
  # Fix handle_new_user_profile trigger default role

  ## Problem
  The `handle_new_user_profile` trigger function defaults to 'pro' when no role
  is provided in user_metadata. This caused client signups via booking pages to
  be registered as professionals in the database.

  ## Changes
  - Updated `handle_new_user_profile` to default to 'client' instead of 'pro'
    when no role is specified in raw_user_meta_data
  - This is the safe default for public-facing signup flows (booking pages)
  - Professional accounts explicitly pass role='pro' via user_metadata

  ## Impact
  - New signups without an explicit role will be 'client' by default
  - Existing profiles are not affected (trigger only fires on INSERT to auth.users)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SET LOCAL row_security = off;

  BEGIN
    INSERT INTO user_profiles (user_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = COALESCE(EXCLUDED.role, user_profiles.role),
      first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name);

    SELECT id INTO v_company_id
    FROM company_profiles
    WHERE user_id = NEW.id
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
      UPDATE user_profiles
      SET company_id = v_company_id
      WHERE user_id = NEW.id AND company_id IS NULL;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user_profiles for %: % (SQLSTATE: %)',
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;
