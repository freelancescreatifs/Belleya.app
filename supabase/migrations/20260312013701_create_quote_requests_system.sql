/*
  # Create Quote Requests System

  1. New Tables
    - `quote_requests`
      - `id` (uuid, primary key)
      - `client_user_id` (uuid) - the authenticated client user
      - `provider_user_id` (uuid) - the provider user
      - `company_id` (uuid) - the provider's company
      - `service_id` (uuid) - the requested service
      - `preferred_date` (date) - indicative date chosen by client
      - `preferred_time` (text) - indicative time chosen by client
      - `client_phone` (text) - client phone number
      - `client_name` (text) - client display name
      - `client_email` (text) - client email
      - `questionnaire_responses` (jsonb) - answers to the service questionnaire
      - `questionnaire_id` (uuid) - which questionnaire was filled
      - `status` (text) - pending, validated, rejected, cancelled
      - `provider_notes` (text) - notes from provider
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `quote_requests` table
    - Clients can insert and view their own quote requests
    - Providers can view and update quote requests for their services

  3. Notification Types
    - Add 'quote_request' and 'quote_validated' to notifications type check
*/

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id),
  provider_user_id uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES company_profiles(id),
  service_id uuid NOT NULL REFERENCES services(id),
  preferred_date date,
  preferred_time text,
  client_phone text DEFAULT '',
  client_name text DEFAULT '',
  client_email text DEFAULT '',
  questionnaire_responses jsonb DEFAULT '{}',
  questionnaire_id uuid REFERENCES service_questionnaires(id),
  status text NOT NULL DEFAULT 'pending',
  provider_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert own quote requests"
  ON quote_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Clients can view own quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = client_user_id OR auth.uid() = provider_user_id);

CREATE POLICY "Providers can update their quote requests"
  ON quote_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_user_id)
  WITH CHECK (auth.uid() = provider_user_id);

DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY[
      'booking_request'::text, 'booking_confirmed'::text, 'booking_rejected'::text,
      'booking_completed'::text, 'booking_cancelled'::text, 'info'::text,
      'reminder'::text, 'affiliate_application'::text, 'questionnaire_completed'::text,
      'quote_request'::text, 'quote_validated'::text
    ])
  );
END $$;

CREATE INDEX IF NOT EXISTS idx_quote_requests_client ON quote_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_provider ON quote_requests(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_company ON quote_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
