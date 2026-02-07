/*
  # Fix Client Results Feed Architecture
  
  ## Critical Fix
  Remove the incorrect trigger that tries to insert into content_calendar with media_url column
  which doesn't exist, causing upload errors.
  
  ## Architecture Change
  The "Pour toi" feed must ONLY read from client_results_photos table.
  - Drop auto_publish_client_result trigger
  - Drop auto_publish_client_result function
  - Add public read access to client_results_photos for the feed
  
  ## Security
  - Allow public to SELECT from client_results_photos (for client feed)
  - Keep existing policies for authenticated users to manage their company's photos
  
  ## Notes
  - client_results_photos is the single source of truth for "Ses résultats"
  - content_calendar is for regular content posts only
  - No mixing between gallery and content calendar
*/

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS trigger_auto_publish_client_result ON client_results_photos;
DROP FUNCTION IF EXISTS auto_publish_client_result();

-- Add public read access to client_results_photos for the "Pour toi" feed
CREATE POLICY "Public can view all client results photos"
  ON client_results_photos FOR SELECT
  TO public
  USING (true);
