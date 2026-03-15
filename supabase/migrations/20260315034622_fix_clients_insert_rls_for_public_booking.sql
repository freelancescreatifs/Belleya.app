/*
  # Fix clients INSERT RLS policy for public booking flow

  ## Problem
  When a client signs up via a booking page (AuthGate), they are authenticated
  but have no company_id of their own. The existing INSERT policies require
  company_id = get_user_company_id(), which returns NULL for a client user,
  causing every client self-registration to be blocked with an RLS violation.

  ## Changes
  - Add a new INSERT policy: "Authenticated users can insert themselves as clients
    during public booking"
  - This policy allows any authenticated user to insert a row into `clients`
    where `belaya_user_id = auth.uid()`, meaning they are only allowed to insert
    themselves — they cannot insert records on behalf of other users.
  - The existing provider-facing INSERT policies are untouched.

  ## Security
  - The WITH CHECK `belaya_user_id = auth.uid()` ensures a user can only create
    a client record linked to their own Supabase auth ID.
  - They cannot spoof another user's belaya_user_id.
*/

CREATE POLICY "Authenticated users can self-register as client via booking"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (belaya_user_id = auth.uid());
