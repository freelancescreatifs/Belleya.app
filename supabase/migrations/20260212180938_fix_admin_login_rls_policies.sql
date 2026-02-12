/*
  # Fix Admin Login - Restore RLS Policies Without Recursion

  1. Changes
    - Re-enable RLS on critical auth tables
    - Create simple, non-recursive policies for user_profiles
    - Create simple, non-recursive policies for company_profiles
    - Create simple policies for user_roles
    - Use auth.uid() directly instead of functions that could cause recursion

  2. Security
    - Users can read/update their own profile
    - Users can read their own company profile
    - Authenticated users can read user roles for authorization checks
*/

-- Re-enable RLS on critical tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_PROFILES POLICIES (Simple, no recursion)
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COMPANY_PROFILES POLICIES (Simple, no recursion)
-- ============================================================================

-- Users can read their own company profile
CREATE POLICY "Users can read own company"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Public can read company profiles for booking
CREATE POLICY "Public can read company profiles for booking"
  ON company_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Users can update their own company profile
CREATE POLICY "Users can update own company"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own company profile
CREATE POLICY "Users can insert own company"
  ON company_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- USER_ROLES POLICIES (Simple read-only for authorization)
-- ============================================================================

-- All authenticated users can read user roles
CREATE POLICY "Authenticated users can read user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow inserts from service role (via triggers)
CREATE POLICY "Service role can manage user roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
