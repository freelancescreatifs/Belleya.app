/*
  # Optimize RLS Policies for Better Performance

  1. Changes
    - Simplify RLS policies to avoid complex nested queries
    - Use direct checks instead of multiple OR conditions
    - Split admin and user policies for better performance
    
  2. Performance
    - Reduce the number of subqueries executed per request
    - Use indexes effectively
    - Cache-friendly policy design
*/

-- Drop existing policies on user_profiles
DROP POLICY IF EXISTS "Allow read own profile or admin" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile or admin" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert own profile or admin" ON user_profiles;
DROP POLICY IF EXISTS "Allow delete for admin only" ON user_profiles;

-- Simple policy: users can always read their own profile (most common case)
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Separate policy for admins to read all profiles (less frequent)
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can insert any profile
CREATE POLICY "Admins can insert all profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
