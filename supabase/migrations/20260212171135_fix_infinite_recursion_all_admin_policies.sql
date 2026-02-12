/*
  # Fix Infinite Recursion in All Admin Policies

  ## Problem
  Multiple tables had admin policies that query user_profiles, creating infinite recursion.

  ## Solution
  Remove all admin policies that check user_profiles.role = 'admin'

  ## Affected Tables
  - company_profiles (3 admin policies)
  - subscriptions (4 admin policies)

  ## Note
  Admin operations should use service role or a different mechanism.
*/

-- Fix company_profiles admin policies
DROP POLICY IF EXISTS "Admins can view all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Admins can update all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Admins can delete all company profiles" ON company_profiles;

-- Fix subscriptions admin policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert any subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON subscriptions;
