/*
  # EMERGENCY FIX - Infinite Recursion in user_profiles RLS

  1. Problem
    - Policy "Admins have full access to profiles" causes infinite recursion
    - It queries user_profiles INSIDE a policy ON user_profiles
    - This creates: policy → SELECT user_profiles → policy → SELECT user_profiles → ∞

  2. Solution
    - DROP all policies that cause recursion
    - Keep ONLY simple policies using auth.uid() = user_id
    - NO subqueries to user_profiles allowed

  3. Security
    - Users can only access their own profile
    - Service role (used by triggers) has full access
*/

-- DROP ALL POLICIES on user_profiles to start clean
DROP POLICY IF EXISTS "Admins have full access to profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- DROP ALL POLICIES on company_profiles that might cause recursion
DROP POLICY IF EXISTS "Admins have full access to companies" ON company_profiles;
DROP POLICY IF EXISTS "Users can read own company" ON company_profiles;
DROP POLICY IF EXISTS "Public can read company profiles for booking" ON company_profiles;
DROP POLICY IF EXISTS "Users can update own company" ON company_profiles;
DROP POLICY IF EXISTS "Users can insert own company" ON company_profiles;

-- DROP ALL POLICIES on user_roles
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can read user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage user roles" ON user_roles;

-- ============================================================================
-- SIMPLE POLICIES - NO RECURSION
-- ============================================================================

-- USER_PROFILES: Only allow users to access their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- COMPANY_PROFILES: Simple access
CREATE POLICY "Users can read own company"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can read companies for booking"
  ON company_profiles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can update own company"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own company"
  ON company_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- USER_ROLES: Read-only for authenticated users
CREATE POLICY "Authenticated can read user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);
