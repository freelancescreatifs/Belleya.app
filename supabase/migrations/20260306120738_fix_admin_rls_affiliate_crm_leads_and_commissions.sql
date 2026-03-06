/*
  # Fix admin RLS for affiliate CRM leads and commissions

  1. Problem
    - `affiliate_crm_leads` table has no admin SELECT policy, so admin dashboard shows 0 leads
    - `affiliate_commissions` admin SELECT/UPDATE policies use `user_profiles.id = auth.uid()` 
      instead of `user_profiles.user_id = auth.uid()`, preventing admin from reading commissions

  2. Fix
    - Add admin SELECT policy on `affiliate_crm_leads` using `is_admin()`
    - Add admin UPDATE policy on `affiliate_crm_leads` using `is_admin()` (for admin_note field)
    - Drop and recreate broken commissions admin policies with correct column reference

  3. Impact
    - Admin CRM Management will now show all CRM leads from all affiliates
    - Admin KPI dashboard will correctly display commission data
    - Leaderboard will show correct revenue figures
    - Vue d'ensemble will show correct lead counts
*/

-- 1. Add admin SELECT on affiliate_crm_leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_crm_leads' AND policyname = 'Admins can view all CRM leads'
  ) THEN
    CREATE POLICY "Admins can view all CRM leads"
      ON affiliate_crm_leads
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- 2. Add admin UPDATE on affiliate_crm_leads (for admin_note)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_crm_leads' AND policyname = 'Admins can update CRM leads'
  ) THEN
    CREATE POLICY "Admins can update CRM leads"
      ON affiliate_crm_leads
      FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- 3. Fix affiliate_commissions admin SELECT policy (wrong column: id vs user_id)
DROP POLICY IF EXISTS "Admins can view all commissions" ON affiliate_commissions;
CREATE POLICY "Admins can view all commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- 4. Fix affiliate_commissions admin UPDATE policy (wrong column: id vs user_id)
DROP POLICY IF EXISTS "Admins can update commissions" ON affiliate_commissions;
CREATE POLICY "Admins can update commissions"
  ON affiliate_commissions
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
