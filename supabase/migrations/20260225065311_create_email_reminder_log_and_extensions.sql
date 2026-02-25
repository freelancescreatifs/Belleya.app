/*
  # Setup Appointment Email Reminder System

  1. Extensions
    - Enable `pg_net` for async HTTP calls from the database
    - Enable `pg_cron` for scheduled job execution

  2. New Tables
    - `email_reminder_log`
      - `id` (uuid, primary key) - unique log entry
      - `event_id` (uuid, unique, references events) - the appointment event
      - `client_id` (uuid, references clients) - the client who was reminded
      - `email` (text) - the email address used at send time
      - `sent_at` (timestamptz) - when the email was sent
      - `status` (text) - 'sent' or 'failed'
      - `error_message` (text, nullable) - error details if failed

  3. Security
    - RLS enabled on `email_reminder_log`
    - Authenticated users can read their own reminder logs (via event ownership)
    - Service role (Edge Functions) handles inserts via bypassing RLS

  4. Indexes
    - Index on `event_id` for fast duplicate checks
    - Index on `sent_at` for log browsing

  5. Important Notes
    - The UNIQUE constraint on `event_id` prevents duplicate reminders
    - pg_cron scheduling will be configured separately via SQL Editor
      (pg_cron requires superuser privileges not available in migrations)
*/

-- Enable pg_net for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Create the reminder tracking table
CREATE TABLE IF NOT EXISTS email_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  email text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text
);

-- Enable RLS
ALTER TABLE email_reminder_log ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated pros can view reminder logs for their own events
CREATE POLICY "Pros can view own reminder logs"
  ON email_reminder_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = email_reminder_log.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Index for fast duplicate lookups by event_id (already unique, but explicit)
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_event_id
  ON email_reminder_log(event_id);

-- Index for browsing logs by date
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_sent_at
  ON email_reminder_log(sent_at DESC);
