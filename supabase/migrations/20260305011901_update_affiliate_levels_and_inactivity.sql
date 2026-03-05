/*
  # Affiliate Level Auto-Update and Inactivity Management

  1. New Functions
    - `update_affiliate_levels()` - Recalculates affiliate level and base_commission_rate
      based on active signup count. Also updates days_since_last_signup.
    - `update_affiliate_inactivity()` - Sets status to 'observation' after 14 days
      and 'disabled' after 30 days of inactivity.

  2. Logic
    - Level thresholds: 0-9 = recrue (10%), 10-49 = closer (12%), 50-149 = pro (15%), 150+ = elite (15%)
    - Inactivity: >=14 days -> observation, >=30 days -> disabled
    - days_since_last_signup is computed from last_signup_date

  3. Security
    - Functions run as SECURITY DEFINER to access all affiliate rows
    - Only called via cron or admin, not exposed to end users

  4. Notes
    - These functions should be called daily via pg_cron or an edge function
    - They update all active affiliates in the belaya_affiliation program
*/

CREATE OR REPLACE FUNCTION public.update_affiliate_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aff RECORD;
  signup_count INTEGER;
  new_level TEXT;
  new_rate NUMERIC;
  days_inactive INTEGER;
BEGIN
  FOR aff IN
    SELECT id, user_id, last_signup_date, status
    FROM affiliates
    WHERE program = 'belaya_affiliation'
      AND status IN ('active', 'observation')
  LOOP
    SELECT COUNT(*) INTO signup_count
    FROM affiliate_signups
    WHERE affiliate_id = aff.id;

    IF signup_count >= 150 THEN
      new_level := 'elite';
      new_rate := 0.15;
    ELSIF signup_count >= 50 THEN
      new_level := 'pro';
      new_rate := 0.15;
    ELSIF signup_count >= 10 THEN
      new_level := 'closer';
      new_rate := 0.12;
    ELSE
      new_level := 'recrue';
      new_rate := 0.10;
    END IF;

    IF aff.last_signup_date IS NOT NULL THEN
      days_inactive := EXTRACT(DAY FROM (NOW() - aff.last_signup_date))::INTEGER;
    ELSE
      days_inactive := 999;
    END IF;

    UPDATE affiliates
    SET
      level = new_level,
      base_commission_rate = new_rate,
      commission_rate = new_rate,
      active_referrals = signup_count,
      days_since_last_signup = days_inactive,
      updated_at = NOW()
    WHERE id = aff.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_affiliate_inactivity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aff RECORD;
  days_inactive INTEGER;
BEGIN
  FOR aff IN
    SELECT id, last_signup_date, status
    FROM affiliates
    WHERE program = 'belaya_affiliation'
      AND status IN ('active', 'observation')
  LOOP
    IF aff.last_signup_date IS NOT NULL THEN
      days_inactive := EXTRACT(DAY FROM (NOW() - aff.last_signup_date))::INTEGER;
    ELSE
      SELECT EXTRACT(DAY FROM (NOW() - aff_created.created_at))::INTEGER
      INTO days_inactive
      FROM affiliates aff_created
      WHERE aff_created.id = aff.id;
    END IF;

    IF days_inactive >= 30 AND aff.status != 'disabled' THEN
      UPDATE affiliates
      SET status = 'disabled', is_active = false, updated_at = NOW()
      WHERE id = aff.id;
    ELSIF days_inactive >= 14 AND aff.status = 'active' THEN
      UPDATE affiliates
      SET status = 'observation', updated_at = NOW()
      WHERE id = aff.id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_daily_affiliate_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM update_affiliate_levels();
  PERFORM update_affiliate_inactivity();
END;
$$;
