/*
  # Fix Client Media Gallery RLS Policies

  1. Changes
    - Drop existing RLS policies for client_inspirations and client_results_photos
    - Recreate policies with correct user_id check instead of id check
    - user_profiles.user_id references auth.users.id, not user_profiles.id

  2. Security
    - Ensures authenticated users can only access their company's client media
    - Fixes the "new row violates row-level security policy" error
*/

-- Drop existing policies for client_inspirations
DROP POLICY IF EXISTS "Users can view their company's client inspirations" ON client_inspirations;
DROP POLICY IF EXISTS "Users can insert their company's client inspirations" ON client_inspirations;
DROP POLICY IF EXISTS "Users can delete their company's client inspirations" ON client_inspirations;

-- Drop existing policies for client_results_photos
DROP POLICY IF EXISTS "Users can view their company's client results photos" ON client_results_photos;
DROP POLICY IF EXISTS "Users can insert their company's client results photos" ON client_results_photos;
DROP POLICY IF EXISTS "Users can delete their company's client results photos" ON client_results_photos;

-- Create corrected RLS policies for client_inspirations
CREATE POLICY "Users can view their company's client inspirations"
  ON client_inspirations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's client inspirations"
  ON client_inspirations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's client inspirations"
  ON client_inspirations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create corrected RLS policies for client_results_photos
CREATE POLICY "Users can view their company's client results photos"
  ON client_results_photos FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's client results photos"
  ON client_results_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's client results photos"
  ON client_results_photos FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );
