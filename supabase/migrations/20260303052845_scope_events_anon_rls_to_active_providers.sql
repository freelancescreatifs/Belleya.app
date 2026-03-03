/*
  # Scope public events access to active providers only

  1. Security Changes
    - Drop the existing overly permissive anon SELECT policy on `events` (was `USING (true)`)
    - Create a new anon SELECT policy that only allows reading events
      for professionals whose `company_profiles.is_accepting_bookings` is true
    - This prevents anonymous data scraping of all calendar events

  2. Important Notes
    - The query joins through `user_id` to `company_profiles`
    - Only events belonging to providers actively accepting bookings are visible
    - Authenticated user policies remain unchanged
*/

DROP POLICY IF EXISTS "Public can view events for availability" ON events;

CREATE POLICY "Public can view events for active providers"
  ON events
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles cp
      WHERE cp.user_id = events.user_id
      AND cp.is_accepting_bookings = true
    )
  );
