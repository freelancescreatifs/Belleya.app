/*
  # Fix Public Booking Access for All Users
  
  ## Problem
  Public booking pages only work for unauthenticated users (anon role).
  When users are logged in as CLIENT or PRO, they cannot access booking pages
  because RLS policies restrict services/events to owner only.
  
  ## Solution
  Add policies that allow ALL authenticated users (not just owners) to view:
  - Active services (for booking selection)
  - Events (for availability checking)
  - Company profiles (for business info)
  - User profiles (for pro names)
  
  This enables the booking flow to work regardless of authentication state.
  
  ## Security
  - Only SELECT operations are allowed
  - Services must be active (status = 'active')
  - No write operations are permitted
  - Owner-only policies remain for INSERT/UPDATE/DELETE
*/

-- Allow authenticated users to view active services from any pro
CREATE POLICY "Authenticated users can view active services"
  ON services
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Allow authenticated users to view events from any pro (for availability)
CREATE POLICY "Authenticated users can view events for booking"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view company profiles from any pro
CREATE POLICY "Authenticated users can view company profiles"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view user profiles (for pro names)
CREATE POLICY "Authenticated users can view user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);