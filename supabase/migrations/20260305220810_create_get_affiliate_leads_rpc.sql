/*
  # Create get_affiliate_leads RPC function

  1. New Function
    - `get_affiliate_leads(p_affiliate_id uuid)` - Returns all signups for an affiliate with computed status and days left
    - Runs as SECURITY DEFINER to bypass RLS issues
    - Only accessible if the caller owns the affiliate or is admin

  2. Returns
    - id, first_name, subscription_status, computed_status, days_left, trial_end_date, monthly_amount, plan_label, created_at

  3. Security
    - Validates that auth.uid() matches the affiliate's user_id OR is admin
    - Returns empty set if unauthorized
*/

CREATE OR REPLACE FUNCTION get_affiliate_leads(p_affiliate_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  subscription_status text,
  computed_status text,
  days_left integer,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  monthly_amount numeric,
  plan_label text,
  mrr numeric,
  commission numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_commission_rate numeric;
BEGIN
  SELECT a.user_id, COALESCE(a.commission_rate, a.base_commission_rate, 0.10)
  INTO v_owner_id, v_commission_rate
  FROM affiliates a
  WHERE a.id = p_affiliate_id;

  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  IF v_owner_id != auth.uid() AND NOT is_admin(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.first_name,
    s.subscription_status,
    CASE
      WHEN s.subscription_status = 'active' THEN 'active'
      WHEN s.subscription_status = 'canceled' THEN 'canceled'
      WHEN s.subscription_status = 'expired' THEN 'expired'
      WHEN COALESCE(s.trial_end_date, s.created_at + interval '14 days') < now() THEN 'expired'
      ELSE 'trialing'
    END AS computed_status,
    CASE
      WHEN s.subscription_status IN ('active', 'canceled', 'expired') THEN 0
      ELSE GREATEST(0, EXTRACT(DAY FROM (COALESCE(s.trial_end_date, s.created_at + interval '14 days') - now()))::integer + 1)
    END AS days_left,
    COALESCE(s.trial_end_date, s.created_at + interval '14 days') AS trial_end_date,
    s.subscription_start_date,
    COALESCE(s.monthly_amount, 0) AS monthly_amount,
    CASE
      WHEN s.subscription_status = 'active' THEN
        CASE
          WHEN COALESCE(s.monthly_amount, 0) >= 49 THEN 'Elite'
          WHEN COALESCE(s.monthly_amount, 0) >= 39 THEN 'Pro'
          ELSE 'Start'
        END
      ELSE NULL
    END AS plan_label,
    CASE
      WHEN s.subscription_status = 'active' THEN
        CASE WHEN COALESCE(s.monthly_amount, 0) > 0 THEN s.monthly_amount ELSE 29 END
      ELSE 0
    END AS mrr,
    CASE
      WHEN s.subscription_status = 'active' THEN
        (CASE WHEN COALESCE(s.monthly_amount, 0) > 0 THEN s.monthly_amount ELSE 29 END) * v_commission_rate
      ELSE 0
    END AS commission,
    s.created_at
  FROM affiliate_signups s
  WHERE s.affiliate_id = p_affiliate_id
  ORDER BY
    CASE
      WHEN s.subscription_status NOT IN ('active', 'canceled', 'expired')
        AND COALESCE(s.trial_end_date, s.created_at + interval '14 days') >= now()
        THEN 0
      WHEN s.subscription_status = 'active' THEN 1
      WHEN COALESCE(s.trial_end_date, s.created_at + interval '14 days') < now() THEN 2
      WHEN s.subscription_status = 'canceled' THEN 3
      ELSE 4
    END,
    s.created_at DESC;
END;
$$;