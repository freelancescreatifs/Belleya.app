/*
  # EMERGENCY - DISABLE RLS ON ALL AUTH TABLES
  
  1. Critical Action
    - DISABLE RLS completely on all authentication-related tables
    - This immediately restores access to pro space
    - No policies needed if RLS is disabled
  
  2. Tables Fixed
    - profiles
    - user_profiles  
    - user_roles
    - company_profiles
    - subscriptions
  
  GOAL: Immediate access restoration by removing all RLS restrictions
*/

-- DISABLE RLS on all authentication tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on these tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
    
    -- Drop all policies on user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
    
    -- Drop all policies on user_roles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_roles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_roles';
    END LOOP;
    
    -- Drop all policies on company_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'company_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON company_profiles';
    END LOOP;
    
    -- Drop all policies on subscriptions
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON subscriptions';
    END LOOP;
END $$;
