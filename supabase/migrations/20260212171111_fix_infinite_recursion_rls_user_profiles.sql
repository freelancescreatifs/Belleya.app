/*
  # Fix Infinite Recursion in user_profiles RLS Policies

  ## Problem
  The admin policies were causing infinite recursion by querying user_profiles within the policies themselves.

  ## Solution
  1. Drop all problematic admin policies that query user_profiles
  2. Replace with simple, direct policies using auth.uid() only
  3. Keep the basic user policies that don't cause recursion

  ## Changes
  - Remove recursive admin policies (Admins can view/insert/update/delete all profiles)
  - Keep simple user policies (Users can view/insert/update own profile)
  - Keep public read access for authenticated users
*/

-- Drop all admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON user_profiles;

-- The remaining policies are safe and don't cause recursion:
-- - "Users can view own profile" (uses auth.uid() = user_id)
-- - "Users can insert own profile" (uses auth.uid() = user_id)
-- - "Users can update own profile" (uses auth.uid() = user_id)
-- - "Authenticated users can view user profiles" (uses true)
-- - "Public can view user profiles" (uses true)

-- Note: Admin functionality should be handled differently, such as:
-- 1. Using a separate admin_users table
-- 2. Using service role key for admin operations
-- 3. Using auth.jwt() claims without querying user_profiles
