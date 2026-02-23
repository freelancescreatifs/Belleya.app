/*
  # Add Stripe Subscription Columns

  1. Modified Tables
    - `subscriptions`
      - Add `stripe_customer_id` (text, nullable) to persist the Stripe Customer ID
      - Update `subscription_status` CHECK constraint to include 'past_due'

  2. Important Notes
    - No data is deleted or modified
    - Existing rows are unaffected
    - 'past_due' status is needed for Stripe recurring payment failures
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_subscription_status_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_subscription_status_check
  CHECK (subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'expired'::text, 'cancelled'::text, 'pending'::text, 'past_due'::text]));
