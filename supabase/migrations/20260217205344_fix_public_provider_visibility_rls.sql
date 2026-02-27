/*
  # Fix provider visibility for clients and public booking

  ## Problem
  Logged-in clients cannot see provider profiles on the map or access
  booking pages because RLS policies on `company_profiles` and
  `user_profiles` only allow users to read their own records.

  The `public_provider_profiles` view joins both tables, so it returns
  nothing when a client (or anonymous user) queries it.

  ## Changes
  1. `company_profiles` - Add SELECT policy for authenticated users to
     read any company profile (needed for map, booking, provider pages)
  2. `user_profiles` - Add SELECT policy for authenticated users to read
     pro user profiles (needed for the `public_provider_profiles` view)
  3. `user_profiles` - Add SELECT policy for anonymous users to read
     basic pro profile info (needed for unauthenticated booking pages)

  ## Security
  - Authenticated policy on user_profiles is scoped to pro role only
  - Anonymous policy on user_profiles is scoped to pro role only
  - No write access is granted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_profiles'
      AND policyname = 'Authenticated users can read all company profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read all company profiles"
      ON company_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
      AND policyname = 'Authenticated users can read pro profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read pro profiles"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (role = 'pro');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
      AND policyname = 'Anonymous users can read pro profiles'
  ) THEN
    CREATE POLICY "Anonymous users can read pro profiles"
      ON user_profiles
      FOR SELECT
      TO anon
      USING (role = 'pro');
  END IF;
END $$;