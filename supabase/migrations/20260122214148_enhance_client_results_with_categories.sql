/*
  # Enhance Client Results Photos with Service Categories

  ## Overview
  Add service category and metadata to client_results_photos so they can
  be properly filtered and displayed in feeds with category tags.

  ## Changes
  1. Add service_id column to link to services table
  2. Add service_category, service_name, service_thumbnail columns for quick access
  3. Add description/caption column
  4. Add likes_count and comments_count columns
  5. Update company_id column in social_feed to reference company_profiles

  ## Architecture
  - client_results_photos is the single source of truth for "Ses résultats"
  - These photos appear in both "Pour toi" feed and profile public feed
  - Category filters work from service_category column
*/

-- Add service-related columns to client_results_photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN service_id uuid REFERENCES services(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'service_category'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN service_category text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'service_name'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN service_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'caption'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN caption text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN likes_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_results_photos' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE client_results_photos ADD COLUMN comments_count integer DEFAULT 0;
  END IF;
END $$;

-- Add company_id to social_feed if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_feed' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE social_feed ADD COLUMN company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE;
    
    -- Populate company_id from user_profiles
    UPDATE social_feed sf
    SET company_id = up.company_id
    FROM user_profiles up
    WHERE sf.user_id = up.id;
  END IF;
END $$;

-- Add photo_url to social_feed if missing (for consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_feed' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE social_feed ADD COLUMN photo_url text;
    
    -- Populate from media_url
    UPDATE social_feed SET photo_url = media_url WHERE media_url IS NOT NULL;
  END IF;
END $$;

-- Add title to social_feed if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_feed' AND column_name = 'title'
  ) THEN
    ALTER TABLE social_feed ADD COLUMN title text;
  END IF;
END $$;

-- Create index on service_category for fast filtering
CREATE INDEX IF NOT EXISTS idx_client_results_photos_service_category 
  ON client_results_photos(service_category);
CREATE INDEX IF NOT EXISTS idx_social_feed_service_category 
  ON social_feed(service_category);

-- Create function to auto-populate service info when service_id is set
CREATE OR REPLACE FUNCTION sync_client_result_service_info()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    SELECT 
      s.name,
      s.service_type
    INTO 
      NEW.service_name,
      NEW.service_category
    FROM services s
    WHERE s.id = NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-populate service info
DROP TRIGGER IF EXISTS trigger_sync_client_result_service_info ON client_results_photos;
CREATE TRIGGER trigger_sync_client_result_service_info
  BEFORE INSERT OR UPDATE ON client_results_photos
  FOR EACH ROW
  WHEN (NEW.service_id IS NOT NULL)
  EXECUTE FUNCTION sync_client_result_service_info();
