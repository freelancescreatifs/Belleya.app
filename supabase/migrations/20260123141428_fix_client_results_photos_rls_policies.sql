/*
  # Fix Client Results Photos RLS Policies
  
  1. Changes
    - Drop existing RLS policies for client_results_photos
    - Create new policies that check company_profiles.user_id instead of user_profiles.company_id
    - This ensures users can insert photos using their company_profiles.id as company_id
  
  2. Security
    - Authenticated users can only insert/view/delete photos for their own company
    - Checks directly against company_profiles table for ownership
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company's client results photos" ON client_results_photos;
DROP POLICY IF EXISTS "Users can insert their company's client results photos" ON client_results_photos;
DROP POLICY IF EXISTS "Users can delete their company's client results photos" ON client_results_photos;
DROP POLICY IF EXISTS "Users can update their company's client results photos" ON client_results_photos;

-- Create new corrected RLS policies using company_profiles
CREATE POLICY "Users can view their company's client results photos"
  ON client_results_photos FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's client results photos"
  ON client_results_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's client results photos"
  ON client_results_photos FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's client results photos"
  ON client_results_photos FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );
