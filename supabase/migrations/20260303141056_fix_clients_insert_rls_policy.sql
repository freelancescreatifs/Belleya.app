/*
  # Fix clients INSERT RLS policy

  1. Problem
    - The "Users can insert own clients" policy on the `clients` table
      references `user_profiles.id = auth.uid()` which never matches
      because `user_profiles.id` is an auto-generated UUID, not the auth user ID.
    - The correct column is `user_profiles.user_id`.

  2. Fix
    - Drop the broken INSERT policy "Users can insert own clients"
    - Recreate it with the corrected column reference: `user_profiles.user_id = auth.uid()`

  3. Security
    - Policy remains restricted to authenticated users only
    - Users can only insert clients where company_id matches their own company
*/

DROP POLICY IF EXISTS "Users can insert own clients" ON clients;

CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT user_profiles.company_id
      FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
    )
  );
