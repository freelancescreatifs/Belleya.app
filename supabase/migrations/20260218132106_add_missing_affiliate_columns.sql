/*
  # Add missing columns to affiliate tables

  1. Modified Tables
    - `affiliate_applications`
      - Add `rejection_reason` (text, nullable) - reason when application is rejected
    - `affiliates`
      - Add `full_name` (text, nullable) - partner display name
      - Add `email` (text, nullable) - partner email
      - Add `total_earned` (numeric, default 0) - cumulative commissions earned
      - Add `commission_rate` (numeric, default 0.10) - alias for base rate used by dashboard
      - Add `active_referrals` (integer, default 0) - alias for active_sub_count
      - Add `is_active` (boolean, default true) - derived from status
    - `affiliate_commissions`
      - Add `amount` (numeric, default 0) - alias for commission_amount
      - Add `subscription_plan` (text, nullable) - plan name for display

  2. Security
    - RLS policies already exist on these tables
    - Adding read policies for affiliates to access own data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_applications' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE affiliate_applications ADD COLUMN rejection_reason text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'email'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'total_earned'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN total_earned numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN commission_rate numeric DEFAULT 0.10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'active_referrals'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN active_referrals integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_commissions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE affiliate_commissions ADD COLUMN amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_commissions' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE affiliate_commissions ADD COLUMN subscription_plan text;
  END IF;
END $$;

-- Sync existing data: copy base_commission_rate to commission_rate, active_sub_count to active_referrals
UPDATE affiliates SET commission_rate = base_commission_rate WHERE commission_rate IS NULL OR commission_rate = 0.10;
UPDATE affiliates SET active_referrals = COALESCE(active_sub_count, 0) WHERE active_referrals = 0;
UPDATE affiliates SET is_active = (status = 'active') WHERE is_active IS NULL;

-- Sync commission amounts
UPDATE affiliate_commissions SET amount = commission_amount WHERE amount IS NULL OR amount = 0;

-- Add RLS policies for affiliates to read own data (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliates' 
    AND policyname = 'Affiliates can read own data'
  ) THEN
    CREATE POLICY "Affiliates can read own data"
      ON affiliates FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_applications' 
    AND policyname = 'Users can read own application'
  ) THEN
    CREATE POLICY "Users can read own application"
      ON affiliate_applications FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_applications' 
    AND policyname = 'Users can insert own application'
  ) THEN
    CREATE POLICY "Users can insert own application"
      ON affiliate_applications FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_commissions' 
    AND policyname = 'Affiliates can read own commissions'
  ) THEN
    CREATE POLICY "Affiliates can read own commissions"
      ON affiliate_commissions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM affiliates
          WHERE affiliates.id = affiliate_commissions.affiliate_id
          AND affiliates.user_id = auth.uid()
        )
      );
  END IF;

  -- Admin policies for affiliate_applications management
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_applications' 
    AND policyname = 'Admins can read all applications'
  ) THEN
    CREATE POLICY "Admins can read all applications"
      ON affiliate_applications FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_applications' 
    AND policyname = 'Admins can update applications'
  ) THEN
    CREATE POLICY "Admins can update applications"
      ON affiliate_applications FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliates' 
    AND policyname = 'Admins can manage affiliates'
  ) THEN
    CREATE POLICY "Admins can manage affiliates"
      ON affiliates FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'admin'
        )
      );
  END IF;

  -- Allow affiliates to read leaderboard (all active affiliates)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliates' 
    AND policyname = 'Authenticated can read active affiliates for leaderboard'
  ) THEN
    CREATE POLICY "Authenticated can read active affiliates for leaderboard"
      ON affiliates FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;
