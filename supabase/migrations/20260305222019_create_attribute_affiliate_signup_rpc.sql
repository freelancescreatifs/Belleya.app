/*
  # Create attribute_affiliate_signup RPC

  1. New Function
    - `attribute_affiliate_signup(p_ref_code text, p_first_name text)` 
    - Called by the front-end after signup to safely attribute the signup to an affiliate
    - SECURITY DEFINER to bypass RLS
    - Only works for the currently authenticated user (auth.uid())
    - Idempotent: does nothing if attribution already exists

  2. Returns
    - success boolean and affiliate_id if found

  3. Security
    - Uses auth.uid() to prevent spoofing
    - Checks that the affiliate exists and is active
    - Prevents duplicate attributions
*/

CREATE OR REPLACE FUNCTION attribute_affiliate_signup(p_ref_code text, p_first_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_affiliate_id uuid;
  v_existing_id uuid;
  v_trial_end timestamptz;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF p_ref_code IS NULL OR p_ref_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_ref_code');
  END IF;

  SELECT id INTO v_existing_id
  FROM affiliate_signups
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_attributed', true, 'signup_id', v_existing_id);
  END IF;

  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE ref_code = p_ref_code
    AND status = 'active'
    AND is_active = true;

  IF v_affiliate_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'affiliate_not_found');
  END IF;

  v_trial_end := now() + interval '14 days';

  INSERT INTO affiliate_signups (
    affiliate_id,
    user_id,
    first_name,
    subscription_status,
    attributed_at,
    trial_start_date,
    trial_end_date
  ) VALUES (
    v_affiliate_id,
    v_user_id,
    p_first_name,
    'trialing',
    now(),
    now(),
    v_trial_end
  );

  RETURN jsonb_build_object('success', true, 'affiliate_id', v_affiliate_id);
END;
$$;