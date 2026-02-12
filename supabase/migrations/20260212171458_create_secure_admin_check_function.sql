/*
  # Create Secure Admin Check Function

  ## Purpose
  Create a safe way to check if the current user is an admin without causing infinite recursion.

  ## Solution
  1. Create a SECURITY DEFINER function that bypasses RLS
  2. Mark it as STABLE to allow PostgreSQL to cache the result
  3. Use this function in all admin policies

  ## Admin User
  - sabrina.benaceur@outlook.com should be set as admin
*/

-- Create a secure function to check if user is admin
-- SECURITY DEFINER allows it to bypass RLS
-- STABLE allows PostgreSQL to cache the result within a query
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Now recreate admin policies using this safe function

-- User profiles admin policies
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert any profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Company profiles admin policies
CREATE POLICY "Admins can view all company profiles"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all company profiles"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all company profiles"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Subscriptions admin policies
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert any subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (is_admin());
