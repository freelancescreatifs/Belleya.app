/*
  # Fix Admin Access - Create is_admin Function

  1. New Functions
    - `is_admin()` - Returns true if the current user has admin role
    - `is_admin(user_id uuid)` - Returns true if the specified user has admin role

  2. Security
    - Functions are SECURITY DEFINER to bypass RLS
    - Add admin policies to user_profiles for admin access
*/

-- Create is_admin function for current user
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Create is_admin function for specific user
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'
  );
END;
$$;

-- Add admin policies to user_profiles
DO $$
BEGIN
  -- Drop existing admin policies if they exist
  DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can insert all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can delete all profiles" ON user_profiles;
END $$;

-- Create admin policies for user_profiles
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

CREATE POLICY "Admins can insert all profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
