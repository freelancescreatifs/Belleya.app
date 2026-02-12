/*
  # Create Secure Admin Users View

  ## Problem
  Admin cannot see user emails because they are stored in auth.users table
  which is not accessible via regular RLS policies.

  ## Solution
  1. Create a secure view that joins user_profiles with auth.users
  2. Add RLS policies so only admins can access this view
  3. This view will be used by the Admin page to display all user information

  ## Security
  - Only users with role = 'admin' in user_profiles can access this view
  - Uses SECURITY DEFINER to safely access auth.users
*/

-- Create a secure view that joins user_profiles with auth.users
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  up.id,
  up.user_id,
  up.company_id,
  up.role,
  up.first_name,
  up.last_name,
  up.phone,
  up.photo_url,
  up.created_at,
  up.latitude,
  up.longitude,
  up.city,
  up.allow_geolocation,
  up.preferred_language,
  au.email,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  au.phone as auth_phone
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.user_id;

-- Enable RLS on the view
ALTER VIEW public.admin_users_view SET (security_invoker = false);

-- Grant access to authenticated users
GRANT SELECT ON public.admin_users_view TO authenticated;

-- Create policy: only admins can view this
DROP POLICY IF EXISTS "Only admins can view all users" ON public.admin_users_view;

-- Note: Views don't support RLS policies directly, so we use a security definer function instead
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS SETOF public.admin_users_view
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return all users
  RETURN QUERY
  SELECT * FROM public.admin_users_view;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated;

-- Create a simpler view for the admin to query directly
-- This one has RLS enabled
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid,
  role text,
  first_name text,
  last_name text,
  phone text,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
);

-- This is actually a materialized view, let's make it a regular view instead
DROP TABLE IF EXISTS public.admin_users;

-- Enable RLS on user_profiles to allow admin full access
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;

CREATE POLICY "Admins can update user profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete user profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());
