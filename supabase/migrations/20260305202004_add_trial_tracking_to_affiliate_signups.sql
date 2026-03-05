/*
  # Add trial tracking fields to affiliate_signups

  1. Modified Tables
    - `affiliate_signups`
      - `trial_start_date` (timestamptz) - when the trial period started
      - `trial_end_date` (timestamptz) - when the trial period ends (signup + 14 days)
      - `subscription_start_date` (timestamptz) - when paid subscription started (if converted)
      - `monthly_amount` (numeric) - monthly subscription amount (if active)

  2. Notes
    - These columns allow the partner dashboard to show trial status, days remaining,
      and conversion tracking without needing to join to the subscriptions table directly.
    - subscription_status already exists on this table.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_signups' AND column_name = 'trial_start_date'
  ) THEN
    ALTER TABLE affiliate_signups ADD COLUMN trial_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_signups' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE affiliate_signups ADD COLUMN trial_end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_signups' AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE affiliate_signups ADD COLUMN subscription_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_signups' AND column_name = 'monthly_amount'
  ) THEN
    ALTER TABLE affiliate_signups ADD COLUMN monthly_amount numeric DEFAULT 0;
  END IF;
END $$;
