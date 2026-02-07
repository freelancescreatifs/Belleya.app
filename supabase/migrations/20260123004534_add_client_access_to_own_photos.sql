/*
  # Add client access to their own photos

  1. New Policies
    - Allow clients to view their own photos from client_results_photos table

  2. Changes
    - Clients can see photos where they are the subject (via clients table)
*/

-- Add policy for clients to view their own result photos
CREATE POLICY "Clients can view their own result photos"
  ON client_results_photos FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
