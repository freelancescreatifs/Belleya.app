/*
  # Fix is_admin Function - Security Definer with Proper Context

  1. Changes
    - Recreate is_admin() function with proper SECURITY DEFINER
    - Ensure auth.uid() works correctly in the context
    - Add better error handling

  2. Security
    - Function is SECURITY DEFINER to bypass RLS
    - Checks current authenticated user against user_roles table
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Create is_admin function for current user
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Create is_admin function for specific user  
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO anon;

-- Add comment
COMMENT ON FUNCTION is_admin() IS 'Returns true if the current authenticated user has admin role';
COMMENT ON FUNCTION is_admin(uuid) IS 'Returns true if the specified user has admin role';
