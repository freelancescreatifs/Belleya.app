/*
  # Système d'abonnements Belleya

  1. Nouvelles tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `company_id` (uuid, référence company_profiles)
      - `plan_type` (text) - 'start', 'studio', 'empire'
      - `subscription_status` (text) - 'trial', 'active', 'expired', 'cancelled'
      - `trial_start_date` (timestamptz)
      - `trial_end_date` (timestamptz)
      - `subscription_start_date` (timestamptz)
      - `subscription_end_date` (timestamptz)
      - `payment_provider` (text) - 'stripe', 'paypal'
      - `payment_provider_subscription_id` (text)
      - `monthly_price` (decimal)
      - `is_legacy_price` (boolean) - Prix bloqué à vie
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS on `subscriptions` table
    - Add policies for company access
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('start', 'studio', 'empire')),
  subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'pending')),
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  payment_provider text CHECK (payment_provider IN ('stripe', 'paypal')),
  payment_provider_subscription_id text,
  monthly_price decimal(10,2),
  is_legacy_price boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(subscription_status);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end_date);

CREATE OR REPLACE FUNCTION auto_create_trial_subscription()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO subscriptions (
    company_id,
    plan_type,
    subscription_status,
    trial_start_date,
    trial_end_date
  ) VALUES (
    NEW.id,
    'start',
    'trial',
    now(),
    now() + interval '14 days'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_trial_subscription
  AFTER INSERT ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_trial_subscription();

CREATE OR REPLACE FUNCTION get_subscription_status(p_company_id uuid)
RETURNS TABLE (
  is_trial boolean,
  is_active boolean,
  days_remaining integer,
  plan_type text,
  subscription_status text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0, ''::text, 'none'::text;
    RETURN;
  END IF;

  IF v_subscription.subscription_status = 'trial' THEN
    RETURN QUERY SELECT
      true,
      true,
      GREATEST(0, EXTRACT(day FROM (v_subscription.trial_end_date - now()))::integer),
      v_subscription.plan_type,
      v_subscription.subscription_status;
  ELSIF v_subscription.subscription_status = 'active' THEN
    RETURN QUERY SELECT
      false,
      true,
      0,
      v_subscription.plan_type,
      v_subscription.subscription_status;
  ELSE
    RETURN QUERY SELECT
      false,
      false,
      0,
      v_subscription.plan_type,
      v_subscription.subscription_status;
  END IF;
END;
$$;