/*
  # EMERGENCY FIX - Restore Access to Pro Space
  
  1. Security Fix
    - Disable RLS on profiles table to restore immediate access
    - Drop all restrictive policies causing authentication blocks
    - Restore basic access configuration
  
  2. Changes
    - Disable RLS on profiles
    - Drop all existing policies on profiles
    - Create simple, permissive policies for authenticated users
  
  CRITICAL: This migration immediately restores access to the pro space
*/

-- 1. Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on profiles (if any exist)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to all profiles" ON profiles;

-- 3. Re-enable RLS with PERMISSIVE policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, permissive policies that won't block authentication
CREATE POLICY "Allow authenticated users to read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
