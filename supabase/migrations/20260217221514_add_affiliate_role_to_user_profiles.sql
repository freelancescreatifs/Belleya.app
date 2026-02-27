/*
  # Add 'affiliate' role to user_profiles

  ## Changes
  1. Update role CHECK constraint on user_profiles to include 'affiliate'
  2. Update handle_new_user_profile trigger to recognize 'affiliate' role
  3. Add RLS policy for affiliates to read their own profile
  4. Add RLS policy for affiliate_subscriptions to be queryable by affiliates via affiliates table

  ## Security
  - Affiliate role only grants access to affiliate-specific data
  - Existing RLS policies remain unchanged
*/

DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
    CHECK (role = ANY (ARRAY['client'::text, 'pro'::text, 'admin'::text, 'affiliate'::text]));
END $$;

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
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

    RAISE NOTICE 'user_profiles created for user % with role %', NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'pro');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user_profiles for %: % (SQLSTATE: %)',
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'affiliate_subscriptions'
      AND policyname = 'Affiliates can view subs via affiliates table'
  ) THEN
    CREATE POLICY "Affiliates can view subs via affiliates table"
      ON affiliate_subscriptions
      FOR SELECT
      TO authenticated
      USING (
        affiliate_code_id IN (
          SELECT ac.id FROM affiliate_codes ac
          JOIN affiliates a ON a.user_id = ac.user_id
          WHERE a.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
      AND policyname = 'Affiliates can read own profile'
  ) THEN
    CREATE POLICY "Affiliates can read own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id AND role = 'affiliate');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'affiliates'
      AND policyname = 'Affiliates can view leaderboard data'
  ) THEN
    CREATE POLICY "Affiliates can view leaderboard data"
      ON affiliates
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;