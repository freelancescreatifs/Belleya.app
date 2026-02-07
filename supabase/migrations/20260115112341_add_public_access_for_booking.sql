/*
  # Add Public Access for Booking Pages

  1. Changes
    - Allow public (unauthenticated) users to read company profiles
    - Allow public users to read services
    - Allow public users to read events (for availability checking)
    - These are necessary for the public booking flow to work

  2. Security
    - Only SELECT operations are allowed for public users
    - All other operations still require authentication
    - RLS remains enabled on all tables
*/

-- Allow public read access to company profiles
CREATE POLICY "Public can view company profiles"
  ON company_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to services
CREATE POLICY "Public can view active services"
  ON services
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Allow public read access to events (for availability checking)
CREATE POLICY "Public can view events for availability"
  ON events
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to user profiles (for pro names)
CREATE POLICY "Public can view user profiles"
  ON user_profiles
  FOR SELECT
  TO anon
  USING (true);