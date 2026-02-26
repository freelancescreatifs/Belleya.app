/*
  # Add Deposit Fee Payer Setting & Commission Tracking

  1. Modified Tables
    - `company_profiles`
      - `deposit_fee_payer` (text, default 'provider') - Controls who pays the 1.5% platform transaction fee on deposits: 'provider' or 'client'
    - `booking_payments`
      - `platform_commission` (numeric(10,2)) - Exact commission amount collected by the platform for this payment
      - `commission_rate` (numeric(5,4), default 0.0150) - The commission rate applied at time of payment (1.5%)

  2. Security
    - No RLS changes needed; existing policies on both tables already cover these columns

  3. Notes
    - The commission rate is stored per-payment for historical accuracy
    - Default fee payer is 'provider' (provider absorbs the 1.5% fee)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'deposit_fee_payer'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN deposit_fee_payer text DEFAULT 'provider';
    ALTER TABLE company_profiles ADD CONSTRAINT check_deposit_fee_payer
      CHECK (deposit_fee_payer IN ('provider', 'client'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_payments' AND column_name = 'platform_commission'
  ) THEN
    ALTER TABLE booking_payments ADD COLUMN platform_commission numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_payments' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE booking_payments ADD COLUMN commission_rate numeric(5,4) DEFAULT 0.0150;
  END IF;
END $$;
