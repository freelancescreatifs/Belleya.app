/*
  # Fix affiliate approval RLS + Create elite affiliate system

  ## Problem Fixed
  - Admin cannot approve affiliate applications because RLS UPDATE policy on
    affiliate_applications checks user_profiles.id = auth.uid() (wrong column)
    and user_profiles.role = 'admin' (admin role not in user_profiles)
  - Same issue on affiliates INSERT/UPDATE policies
  - Fixed all policies to use is_admin(auth.uid()) which checks user_roles

  ## Changes

  1. Fix RLS Policies
    - Drop and recreate broken UPDATE policy on affiliate_applications
    - Drop and recreate broken INSERT policies on affiliates
    - Drop and recreate broken UPDATE policy on affiliates
    - Drop and recreate broken SELECT policies on affiliates

  2. New columns on affiliates (for elite system)
    - `last_activity_date` (timestamptz) - tracks last activity
    - `days_since_last_signup` (integer, default 0) - calculated field

  3. New table: `monthly_competitions`
    - Tracks monthly competition rankings and rewards
    - `month` (text) - YYYY-MM format
    - `affiliate_id` (uuid)
    - `rank` (integer)
    - `reward_amount` (numeric)
    - `commission_total` (numeric)
    - `signups_total` (integer)

  4. Security
    - All policies use is_admin() function for admin checks
    - RLS enabled on new tables
    - Affiliates can read competition data
*/

-- ============================================================
-- STEP 1: Fix broken RLS policies on affiliate_applications
-- ============================================================

DROP POLICY IF EXISTS "Admins can update applications" ON affiliate_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON affiliate_applications;

CREATE POLICY "Admins can update applications"
  ON affiliate_applications FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view all applications v2"
  ON affiliate_applications FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================
-- STEP 2: Fix broken RLS policies on affiliates
-- ============================================================

DROP POLICY IF EXISTS "Admins can create affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can insert affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can update affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can view all affiliates" ON affiliates;

CREATE POLICY "Admins can insert affiliates v2"
  ON affiliates FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update affiliates v2"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view all affiliates v2"
  ON affiliates FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete affiliates"
  ON affiliates FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================
-- STEP 3: Add missing columns for elite system
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN last_activity_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'days_since_last_signup'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN days_since_last_signup integer DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- STEP 4: Create monthly_competitions table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS monthly_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id),
  rank integer NOT NULL,
  reward_amount numeric DEFAULT 0,
  commission_total numeric DEFAULT 0,
  signups_total integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(month, affiliate_id)
);

ALTER TABLE monthly_competitions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'monthly_competitions'
    AND policyname = 'Affiliates can read competitions'
  ) THEN
    CREATE POLICY "Affiliates can read competitions"
      ON monthly_competitions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM affiliates
          WHERE affiliates.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'monthly_competitions'
    AND policyname = 'Admins can manage competitions'
  ) THEN
    CREATE POLICY "Admins can manage competitions"
      ON monthly_competitions FOR ALL
      TO authenticated
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- STEP 5: Create RPC function for admin to approve affiliate
-- This bypasses RLS issues by using SECURITY DEFINER
-- ============================================================

CREATE FUNCTION approve_affiliate_application(
  p_application_id uuid,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_affiliate_id uuid;
  v_ref_code text;
  v_existing_affiliate RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_admin_id AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT * INTO v_app
  FROM affiliate_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF v_app.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application already approved');
  END IF;

  UPDATE affiliate_applications
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_admin_id
  WHERE id = p_application_id;

  SELECT * INTO v_existing_affiliate
  FROM affiliates
  WHERE user_id = v_app.user_id;

  IF FOUND THEN
    UPDATE affiliates
    SET status = 'active', is_active = true, updated_at = now()
    WHERE id = v_existing_affiliate.id;
    v_affiliate_id := v_existing_affiliate.id;
  ELSE
    v_ref_code := 'BEL' || upper(substr(md5(random()::text), 1, 6));

    INSERT INTO affiliates (user_id, ref_code, level, base_commission_rate, commission_rate, status, is_active, full_name, email, last_activity_date)
    VALUES (v_app.user_id, v_ref_code, 'recrue', 0.10, 0.10, 'active', true, v_app.full_name, v_app.email, now())
    RETURNING id INTO v_affiliate_id;
  END IF;

  UPDATE user_profiles
  SET affiliate_id = v_affiliate_id, role = 'affiliate'
  WHERE user_id = v_app.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'affiliate_id', v_affiliate_id,
    'application_id', p_application_id
  );
END;
$$;

-- ============================================================
-- STEP 6: Create RPC for rejecting applications
-- ============================================================

CREATE FUNCTION reject_affiliate_application(
  p_application_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_admin_id AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE affiliate_applications
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = p_admin_id,
      rejection_reason = p_reason
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
