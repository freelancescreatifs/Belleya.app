/*
  # Schedule Daily Appointment Reminder Cron Job

  ## Summary
  Sets up a pg_cron job that triggers the `send-appointment-reminders` edge function
  every morning at 8:00 AM UTC. This sends reminder emails to clients who have
  appointments the following day (i.e., 24 hours before their appointment).

  ## How It Works
  - pg_cron runs the job daily at 08:00 UTC
  - It calls the `send-appointment-reminders` edge function via pg_net HTTP POST
  - The edge function queries all confirmed appointments for tomorrow
  - It checks `email_reminder_log` to avoid sending duplicate reminders
  - Emails are sent via Resend API with the branded Belaya template

  ## Prerequisites
  - pg_cron extension must be enabled (done in previous migration)
  - pg_net extension must be enabled (done in previous migration)
  - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be available as env vars

  ## Notes
  - The cron job is named 'send-daily-appointment-reminders' for easy management
  - To pause it: SELECT cron.unschedule('send-daily-appointment-reminders');
  - To check jobs: SELECT * FROM cron.job;
  - To check run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
*/

-- Remove any existing job with same name to allow re-running safely
SELECT cron.unschedule('send-daily-appointment-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-daily-appointment-reminders'
);

-- Schedule the daily reminder job at 08:00 UTC every day
SELECT cron.schedule(
  'send-daily-appointment-reminders',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-appointment-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
