/*
  # Fix sync_affiliate_signup_statuses to normalize trial status

  1. Changes
    - Updated the sync function to normalize `trial` status to `trialing` for consistency
    - The subscriptions table uses `trial` but affiliate_signups expects `trialing`
    - This prevents status mismatch that causes signups to not display correctly

  2. Important Notes
    - No data loss - only status normalization
    - Frontend expects: trialing, active, canceled, expired
*/

CREATE OR REPLACE FUNCTION sync_affiliate_signup_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_signups AS asig
  SET
    subscription_status = CASE
      WHEN sub.subscription_status = 'active' THEN 'active'
      WHEN sub.subscription_status = 'canceled' THEN 'canceled'
      WHEN sub.subscription_status IN ('trial', 'trialing') THEN
        CASE
          WHEN COALESCE(sub.trial_end_date, asig.trial_end_date, asig.created_at + interval '14 days') < now() THEN 'expired'
          ELSE 'trialing'
        END
      WHEN sub.subscription_status IS NULL THEN
        CASE
          WHEN COALESCE(asig.trial_end_date, asig.created_at + interval '14 days') < now() THEN 'expired'
          ELSE 'trialing'
        END
      ELSE COALESCE(sub.subscription_status, 'trialing')
    END,
    trial_start_date = COALESCE(sub.trial_start_date, asig.trial_start_date, asig.created_at),
    trial_end_date = COALESCE(sub.trial_end_date, asig.trial_end_date, asig.created_at + interval '14 days'),
    subscription_start_date = sub.subscription_start_date,
    monthly_amount = COALESCE(sub.monthly_price, 0)
  FROM company_profiles cp
  LEFT JOIN subscriptions sub ON sub.company_id = cp.id
  WHERE asig.user_id = cp.user_id;

  UPDATE affiliate_signups
  SET
    subscription_status = 'expired',
    trial_end_date = COALESCE(trial_end_date, created_at + interval '14 days')
  WHERE user_id NOT IN (SELECT user_id FROM company_profiles)
    AND COALESCE(trial_end_date, created_at + interval '14 days') < now()
    AND subscription_status NOT IN ('active', 'canceled', 'expired');

  UPDATE affiliate_signups
  SET
    trial_start_date = COALESCE(trial_start_date, created_at),
    trial_end_date = COALESCE(trial_end_date, created_at + interval '14 days')
  WHERE trial_end_date IS NULL;

  UPDATE affiliate_signups
  SET subscription_status = 'trialing'
  WHERE subscription_status = 'trial';
END;
$$;