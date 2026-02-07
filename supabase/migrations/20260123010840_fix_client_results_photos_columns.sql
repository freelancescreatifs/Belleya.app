/*
  # Fix client_results_photos columns

  1. Changes
    - Rename `url` to `photo_url` for consistency
    - Add `show_in_gallery` column (default true)
    
  2. Notes
    - All existing photos will be visible in gallery by default
*/

-- Rename url to photo_url for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'url'
  ) THEN
    ALTER TABLE client_results_photos RENAME COLUMN url TO photo_url;
  END IF;
END $$;

-- Add show_in_gallery column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'show_in_gallery'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN show_in_gallery boolean DEFAULT true;
  END IF;
END $$;
