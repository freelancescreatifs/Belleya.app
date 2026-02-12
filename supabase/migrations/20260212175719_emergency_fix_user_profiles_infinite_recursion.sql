/*
  # EMERGENCY FIX - Remove Infinite Recursion on user_profiles
  
  1. Critical Issue
    - is_admin() function queries user_profiles
    - Policies on user_profiles use is_admin()
    - This creates infinite recursion blocking authentication
  
  2. Fix
    - Drop all policies using is_admin() on user_profiles
    - Create simple, non-recursive policies
    - Allow authenticated users to read all user profiles
    - Allow users to manage their own profile
  
  CRITICAL: This migration removes the recursion causing authentication blocks
*/

-- 1. Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;

-- 2. Create simple, non-recursive policies
-- Allow all authenticated users to read all profiles (needed for admin checks)
CREATE POLICY "Authenticated users can read all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
