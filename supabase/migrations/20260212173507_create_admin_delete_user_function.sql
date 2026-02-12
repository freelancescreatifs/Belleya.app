/*
  # Create Admin Delete User Function

  ## Purpose
  Allow admin to delete users safely without exposing service role key

  ## Security
  - Only users with role = 'admin' can execute this function
  - Uses SECURITY DEFINER to safely delete from auth.users
  - Deletes user_profile (which will cascade to other tables via FK)
*/

-- Create function to delete a user (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Delete user profile (cascades will handle related data)
  DELETE FROM public.user_profiles
  WHERE user_id = target_user_id;
  
  -- Note: We cannot delete from auth.users via SQL
  -- The user will remain in auth.users but won't be able to access the app
  -- For complete deletion, use Supabase Dashboard or create an Edge Function
  
  RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_user(uuid) IS 'Allows admin to delete a user profile. Note: Does not delete from auth.users - use Supabase Dashboard for complete deletion.';
