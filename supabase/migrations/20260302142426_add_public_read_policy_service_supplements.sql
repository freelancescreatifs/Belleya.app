/*
  # Add public read access to service_supplements

  ## Problem
  The public booking page (/book/:username) fetches services with their supplements,
  but the service_supplements table has no SELECT policy for anonymous (anon) visitors
  or non-owner authenticated users. This causes supplements to silently return empty
  on the public booking page.

  ## Changes
  1. Add SELECT policy for `anon` role on `service_supplements`
     - Scoped: only returns supplements whose parent service is active
  2. Add SELECT policy for `authenticated` role on `service_supplements`
     - Scoped: same active-service check, so logged-in clients can see provider supplements
     - The existing owner-only policy is kept for the provider's own management views

  ## Security
  - Read-only (SELECT) policies only -- no write access granted
  - Scoped to supplements belonging to active services only
  - Write policies (INSERT, UPDATE, DELETE) remain owner-only
*/

CREATE POLICY "Public can view supplements of active services"
  ON service_supplements
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_supplements.service_id
      AND services.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can view supplements of active services"
  ON service_supplements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_supplements.service_id
      AND services.status = 'active'
    )
  );
