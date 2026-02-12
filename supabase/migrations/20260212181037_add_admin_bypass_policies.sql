/*
  # Add Admin Bypass Policies

  1. Changes
    - Add policies that allow admins to access all data
    - This ensures admins can always login and access the admin panel
    - Admins are identified by checking the user_roles table

  2. Security
    - Only users with role 'admin' in user_profiles can bypass restrictions
    - Uses a simple check without recursion
*/

-- Create a simple function to check if user is admin (no recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Add admin policies to user_profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add admin policies to company_profiles
CREATE POLICY "Admins can read all companies"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all companies"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add admin policies to user_roles
CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
