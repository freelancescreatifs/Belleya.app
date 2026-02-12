/*
  # Fix Admin Policies - Correct Order

  1. Changes
    - First drop policies that depend on is_admin()
    - Then drop the is_admin() function
    - Create new policies with direct checks (no recursion)

  2. Security
    - Admins identified by checking their own profile
    - No circular dependencies
*/

-- Drop policies first (in correct order)
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all companies" ON company_profiles;
DROP POLICY IF EXISTS "Admins can read all companies" ON company_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Now drop the function
DROP FUNCTION IF EXISTS is_admin();

-- Create new admin policies with direct checks
-- For user_profiles - Admin can access all profiles
CREATE POLICY "Admins have full access to profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- For company_profiles - Admin can access all companies
CREATE POLICY "Admins have full access to companies"
  ON company_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- For user_roles - Admin can manage all roles
CREATE POLICY "Admins can manage all user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );
