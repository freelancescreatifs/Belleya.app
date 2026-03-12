/*
  # Service Questionnaires & Documents System

  1. Changes to existing tables
    - `services`: Add `is_on_quote` (boolean) - marks service as "on quote" (no price displayed)

  2. New Tables
    - `service_questionnaires`
      - `id` (uuid, primary key)
      - `service_id` (uuid, FK to services)
      - `user_id` (uuid, FK to auth.users) - the provider who created it
      - `title` (text) - questionnaire name
      - `description` (text) - optional description
      - `fields` (jsonb) - array of field definitions [{label, type, required, options}]
      - `is_active` (boolean) - whether this questionnaire is currently active
      - `send_once_only` (boolean, default true) - only sent once per client per service
      - `created_at`, `updated_at` (timestamptz)

    - `client_questionnaire_submissions`
      - `id` (uuid, primary key)
      - `questionnaire_id` (uuid, FK to service_questionnaires)
      - `client_id` (uuid, FK to clients)
      - `service_id` (uuid, FK to services)
      - `company_id` (uuid, FK to company_profiles)
      - `booking_id` (uuid, nullable, FK to bookings)
      - `status` (text) - 'sent', 'pending', 'completed'
      - `responses` (jsonb) - the client's answers
      - `sent_at` (timestamptz) - when it was sent
      - `completed_at` (timestamptz) - when the client completed it
      - `created_at` (timestamptz)

  3. Security
    - RLS enabled on all new tables
    - Providers can manage their own questionnaires
    - Providers can view submissions for their company
    - Clients can view and complete their own submissions

  4. Notification type updated
    - Added 'questionnaire_completed' to notifications type constraint
    - Added 'questionnaire_received' to client_notifications type constraint
*/

-- Add is_on_quote to services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'is_on_quote'
  ) THEN
    ALTER TABLE services ADD COLUMN is_on_quote boolean DEFAULT false;
  END IF;
END $$;

-- Create service_questionnaires table
CREATE TABLE IF NOT EXISTS service_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  send_once_only boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own questionnaires"
  ON service_questionnaires FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own questionnaires"
  ON service_questionnaires FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update own questionnaires"
  ON service_questionnaires FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can delete own questionnaires"
  ON service_questionnaires FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create client_questionnaire_submissions table
CREATE TABLE IF NOT EXISTS client_questionnaire_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES service_questionnaires(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent',
  responses jsonb DEFAULT '{}',
  sent_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT submissions_status_check CHECK (status IN ('sent', 'pending', 'completed'))
);

ALTER TABLE client_questionnaire_submissions ENABLE ROW LEVEL SECURITY;

-- Provider can view submissions for their company
CREATE POLICY "Providers can view company submissions"
  ON client_questionnaire_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = client_questionnaire_submissions.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Provider can insert submissions (manual send)
CREATE POLICY "Providers can insert company submissions"
  ON client_questionnaire_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = client_questionnaire_submissions.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Provider can update submissions for their company
CREATE POLICY "Providers can update company submissions"
  ON client_questionnaire_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = client_questionnaire_submissions.company_id
      AND company_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = client_questionnaire_submissions.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Provider can delete submissions for their company
CREATE POLICY "Providers can delete company submissions"
  ON client_questionnaire_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = client_questionnaire_submissions.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Client can view own submissions (via belaya_user_id on clients table)
CREATE POLICY "Clients can view own submissions"
  ON client_questionnaire_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_questionnaire_submissions.client_id
      AND clients.belaya_user_id = auth.uid()
    )
  );

-- Client can update own submissions (to fill responses)
CREATE POLICY "Clients can complete own submissions"
  ON client_questionnaire_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_questionnaire_submissions.client_id
      AND clients.belaya_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_questionnaire_submissions.client_id
      AND clients.belaya_user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_questionnaires_service_id ON service_questionnaires(service_id);
CREATE INDEX IF NOT EXISTS idx_service_questionnaires_user_id ON service_questionnaires(user_id);
CREATE INDEX IF NOT EXISTS idx_client_questionnaire_submissions_client_id ON client_questionnaire_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_questionnaire_submissions_company_id ON client_questionnaire_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_client_questionnaire_submissions_service_id ON client_questionnaire_submissions(service_id);
CREATE INDEX IF NOT EXISTS idx_client_questionnaire_submissions_questionnaire_id ON client_questionnaire_submissions(questionnaire_id);

-- Unique constraint: one submission per client per questionnaire (when send_once_only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_client_questionnaire
  ON client_questionnaire_submissions(client_id, questionnaire_id)
  WHERE status != 'completed';

-- Update notifications type constraint to include questionnaire_completed
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'booking_completed', 'booking_cancelled', 'info', 'reminder', 'affiliate_application', 'questionnaire_completed'));

-- Update client_notifications type constraint to include questionnaire_received
ALTER TABLE client_notifications DROP CONSTRAINT IF EXISTS client_notifications_notification_type_check;
ALTER TABLE client_notifications ADD CONSTRAINT client_notifications_notification_type_check
  CHECK (notification_type IN ('booking_confirmed', 'booking_rejected', 'booking_reminder', 'new_content', 'new_availability', 'provider_message', 'questionnaire_received'));
