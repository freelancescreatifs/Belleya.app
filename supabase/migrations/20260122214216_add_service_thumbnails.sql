/*
  # Add Service Thumbnails

  ## Overview
  Add thumbnail images to services for visual representation in:
  - Profile public services section
  - Category filters in feeds
  - Service selectors

  ## Changes
  1. Add thumbnail column to services table (photo_url already exists)
  2. Add display_order column for sorting services
*/

-- Add display_order column for sorting services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE services ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Create index for fast sorting (using user_id, not company_id)
CREATE INDEX IF NOT EXISTS idx_services_display_order 
  ON services(user_id, display_order, created_at);

-- Note: photo_url already exists and can be used as thumbnail
