/*
  # Fix signup company_profile sync ordering issue

  ## Problem
  During signup, 5 AFTER INSERT triggers fire on auth.users in alphabetical order:
  1. create_default_content_view_preferences_trigger
  2. on_auth_user_created (profiles - legacy)
  3. on_auth_user_created_company_profile (company_profiles)
  4. on_auth_user_created_production_defaults
  5. on_auth_user_created_profile (user_profiles)

  Trigger #3 inserts a company_profiles row, which fires sync_company_id_to_user_profile
  to UPDATE user_profiles.company_id. But user_profiles doesn't exist yet (trigger #5
  hasn't fired), so the UPDATE hits 0 rows and company_id stays NULL forever.

  ## Fix
  1. Update handle_new_user_profile (trigger #5) to also look up the company_profiles
     row and set company_id immediately after creating user_profiles
  2. Fix the two stuck users who signed up with NULL company_id
  3. Create missing company_profiles for any pro users still missing them
  4. Ensure all existing pro user_profiles have company_id set

  ## Affected Tables
  - user_profiles: company_id column now gets set during signup
  - company_profiles: missing rows created for stuck pro users

  ## Security
  - All functions use SECURITY DEFINER with search_path=public
  - SET LOCAL row_security = off to bypass RLS during trigger execution
*/

-- Step 1: Replace handle_new_user_profile to also sync company_id
CREATE OR REPLACE FUNCTION handle_new_user_profile()
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
      COALESCE(NEW.raw_user_meta_data->>'role', 'pro'),
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

-- Step 2: Also update handle_new_company_profile to try syncing company_id
-- in case user_profiles was somehow created first
CREATE OR REPLACE FUNCTION handle_new_company_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_new_company_id uuid;
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
          NULLIF(TRIM(
            COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
          ), ''),
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
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id INTO v_new_company_id;

      IF v_new_company_id IS NOT NULL THEN
        UPDATE user_profiles
        SET company_id = v_new_company_id
        WHERE user_id = NEW.id AND company_id IS NULL;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create company_profiles for %: % (SQLSTATE: %)',
          NEW.id, SQLERRM, SQLSTATE;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Fix stuck users - create missing company_profiles for pro users
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
SELECT
  up.user_id,
  COALESCE(
    NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
    SPLIT_PART(au.email, '@', 1),
    'Mon Entreprise'
  ),
  'onglerie',
  CURRENT_DATE,
  'France',
  'MICRO',
  'VAT_FRANCHISE',
  false,
  false
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
LEFT JOIN company_profiles cp ON cp.user_id = up.user_id
WHERE up.role = 'pro'
  AND cp.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Fix all pro user_profiles that have NULL company_id
UPDATE user_profiles up
SET company_id = cp.id
FROM company_profiles cp
WHERE cp.user_id = up.user_id
  AND up.company_id IS NULL
  AND up.role = 'pro';
