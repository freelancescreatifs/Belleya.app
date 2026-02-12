/*
  # Fix company_profiles RLS policies

  1. Changes
    - Fix policies to use user_profiles.user_id instead of user_profiles.id
    - This ensures users can access their own company profiles
    
  2. Security
    - Maintains same security level
    - Only fixes the column reference
*/

-- Drop existing policies that use wrong column
DROP POLICY IF EXISTS "Users can view own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can update own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can delete own company profile" ON company_profiles;

-- Recreate policies with correct column reference
CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );
