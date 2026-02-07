/*
  # Fix RLS policies for content_calendar

  1. Changes
    - Add policies to allow users to access their own content via user_id
    - Keep existing company-based policies
    - This fixes the issue where content with null company_id cannot be read

  2. Security
    - Users can read/write content where user_id = auth.uid()
    - Users can also read/write content via company_id (existing policies remain)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view company content" ON content_calendar;
DROP POLICY IF EXISTS "Users can insert company content" ON content_calendar;
DROP POLICY IF EXISTS "Users can update company content" ON content_calendar;
DROP POLICY IF EXISTS "Users can delete company content" ON content_calendar;

-- Create new policies with both user_id and company_id checks
CREATE POLICY "Users can view their content"
  ON content_calendar
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their content"
  ON content_calendar
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their content"
  ON content_calendar
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their content"
  ON content_calendar
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );