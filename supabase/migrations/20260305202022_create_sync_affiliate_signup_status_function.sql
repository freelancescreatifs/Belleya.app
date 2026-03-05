/*
  # Create function to sync affiliate signup subscription statuses

  1. New Functions
    - `sync_affiliate_signup_statuses()` - Updates affiliate_signups rows with current
      subscription data from the subscriptions table.
      
  2. Logic
    - Joins affiliate_signups.user_id -> company_profiles.user_id -> subscriptions.company_id
    - Updates subscription_status, trial_start_date, trial_end_date, subscription_start_date, monthly_amount
    - For signups where no subscription exists and trial_end_date has passed, marks as 'expired'
    - For signups with no trial_end_date set, defaults to created_at + 14 days
    
  3. Notes
    - This function can be called periodically or on-demand from the partner dashboard
    - It ensures affiliate_signups always reflects the latest subscription state
*/

CREATE OR REPLACE FUNCTION sync_affiliate_signup_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_signups AS asig
  SET
    subscription_status = COALESCE(sub.subscription_status, 
      CASE 
        WHEN COALESCE(asig.trial_end_date, asig.created_at + interval '14 days') < now() THEN 'expired'
        ELSE 'trialing'
      END
    ),
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
END;
$$;
