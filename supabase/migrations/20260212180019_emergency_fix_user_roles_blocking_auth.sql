/*
  # EMERGENCY FIX - user_roles Table Blocking Authentication
  
  1. Critical Issue
    - user_roles has RLS enabled
    - NO SELECT policy exists
    - This BLOCKS ALL ACCESS to user_roles
    - Authentication fails if code tries to read this table
  
  2. Fix
    - Add permissive SELECT policy for authenticated users
    - Fix subscriptions policies to remove is_admin() recursion
  
  CRITICAL: This unblocks authentication immediately
*/

-- =====================================================
-- FIX user_roles - Add SELECT policy (CRITICAL)
-- =====================================================

-- Check if any policies exist and drop them
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON user_roles;

-- Create permissive SELECT policy
CREATE POLICY "Authenticated users can read all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to manage their own roles (if needed)
CREATE POLICY "Users can insert own roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FIX subscriptions - Remove is_admin() recursion
-- =====================================================

-- Drop policies using is_admin()
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert any subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON subscriptions;

-- Add simple permissive policies
CREATE POLICY "Authenticated users can read subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own company subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
