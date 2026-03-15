/*
  # Add 'completed' Status and review_request_sent to Events

  ## Summary
  This migration extends the events table to support a "completed" appointment status
  and tracks whether a review request email has been sent to the client.

  ## Changes

  ### Modified Tables
  - `events`
    - Adds `review_request_sent` (boolean, DEFAULT false): tracks if a review request email was already sent for this appointment, preventing duplicate emails.
    - Extends the `status` CHECK constraint to include `'completed'` alongside existing values.

  ## Notes
  1. The existing CHECK constraint on `status` is dropped and recreated to include 'completed'.
  2. No existing data is affected — all current statuses remain valid.
  3. `review_request_sent` defaults to false, so no review requests are retroactively triggered.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'review_request_sent'
  ) THEN
    ALTER TABLE events ADD COLUMN review_request_sent boolean DEFAULT false;
  END IF;
END $$;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed'));
