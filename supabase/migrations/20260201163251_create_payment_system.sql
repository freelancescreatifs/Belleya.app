/*
  # Système de paiement en ligne (Stripe Connect + PayPal)

  1. New Tables
    - `provider_payment_accounts`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to company_profiles)
      - `provider` (text: 'stripe' or 'paypal')
      - `account_id` (text: stripe_account_id or paypal_merchant_id)
      - `status` (text: 'pending', 'active', 'incomplete', 'disabled')
      - `charges_enabled` (boolean)
      - `payouts_enabled` (boolean)
      - `capabilities` (jsonb: detailed capabilities)
      - `account_link_url` (text, nullable: for incomplete onboarding)
      - `account_link_expires_at` (timestamptz, nullable)
      - `metadata` (jsonb: additional provider-specific data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `booking_payments`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `company_id` (uuid, foreign key to company_profiles)
      - `client_id` (uuid, foreign key to clients, nullable)
      - `provider` (text: 'stripe' or 'paypal')
      - `payment_intent_id` (text: stripe payment_intent or paypal order_id)
      - `amount` (numeric: total amount in euros)
      - `currency` (text: default 'EUR')
      - `status` (text: 'pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')
      - `payment_method` (text: card type, paypal, etc.)
      - `error_message` (text, nullable)
      - `metadata` (jsonb: additional payment data)
      - `paid_at` (timestamptz, nullable)
      - `refunded_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payment_webhooks_log`
      - `id` (uuid, primary key)
      - `provider` (text: 'stripe' or 'paypal')
      - `event_id` (text: unique event identifier)
      - `event_type` (text: event type)
      - `payload` (jsonb: full webhook payload)
      - `processed` (boolean: default false)
      - `processed_at` (timestamptz, nullable)
      - `error` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for providers to manage their payment accounts
    - Policies for viewing payment status
    - Admin access for payment management

  3. Indexes
    - Index on company_id for fast lookup
    - Index on booking_id for payment tracking
    - Index on event_id for idempotency

  4. Functions & Triggers
    - Auto-update booking status when payment succeeds
    - Check if provider has active payment method
*/

-- Create provider_payment_accounts table
CREATE TABLE IF NOT EXISTS provider_payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  account_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'incomplete', 'disabled')),
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  capabilities jsonb DEFAULT '{}',
  account_link_url text,
  account_link_expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

-- Create booking_payments table
CREATE TABLE IF NOT EXISTS booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  payment_intent_id text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')),
  payment_method text,
  error_message text,
  metadata jsonb DEFAULT '{}',
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(payment_intent_id)
);

-- Create payment_webhooks_log table
CREATE TABLE IF NOT EXISTS payment_webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_provider_payment_accounts_company_id ON provider_payment_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_provider_payment_accounts_status ON provider_payment_accounts(status);
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_company_id ON booking_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON booking_payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_log_event_id ON payment_webhooks_log(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_log_processed ON payment_webhooks_log(processed);

-- Enable RLS
ALTER TABLE provider_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_payment_accounts

CREATE POLICY "Providers can view own payment accounts"
  ON provider_payment_accounts FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can insert own payment accounts"
  ON provider_payment_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update own payment accounts"
  ON provider_payment_accounts FOR UPDATE
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

-- RLS Policies for booking_payments

CREATE POLICY "Providers can view own booking payments"
  ON booking_payments FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own booking payments"
  ON booking_payments FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all booking payments"
  ON booking_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payment_webhooks_log

CREATE POLICY "Service role can manage webhooks log"
  ON payment_webhooks_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Providers can view related webhooks"
  ON payment_webhooks_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM booking_payments bp
      WHERE bp.payment_intent_id = (payment_webhooks_log.payload->>'payment_intent_id')
      AND bp.company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Add payment_status column to bookings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'not_required'
      CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'));
  END IF;
END $$;

-- Function to update booking status when payment is successful
CREATE OR REPLACE FUNCTION update_booking_on_payment_success()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE bookings
    SET
      status = 'confirmed',
      payment_status = 'paid',
      updated_at = now()
    WHERE id = NEW.booking_id;

    NEW.paid_at = now();
  END IF;

  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    UPDATE bookings
    SET
      payment_status = 'failed',
      updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;

  IF NEW.status IN ('refunded', 'partially_refunded') AND OLD.status NOT IN ('refunded', 'partially_refunded') THEN
    UPDATE bookings
    SET
      payment_status = NEW.status,
      updated_at = now()
    WHERE id = NEW.booking_id;

    NEW.refunded_at = now();
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update booking when payment status changes
DROP TRIGGER IF EXISTS trigger_update_booking_on_payment ON booking_payments;
CREATE TRIGGER trigger_update_booking_on_payment
  BEFORE UPDATE ON booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_on_payment_success();

-- Function to check if provider has active payment method
CREATE OR REPLACE FUNCTION has_active_payment_method(p_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM provider_payment_accounts
    WHERE company_id = p_company_id
    AND status = 'active'
    AND charges_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE provider_payment_accounts IS 'Stores Stripe Connect and PayPal account information for providers';
COMMENT ON TABLE booking_payments IS 'Tracks all payment transactions for bookings';
COMMENT ON TABLE payment_webhooks_log IS 'Logs all payment webhooks for debugging and idempotency';
