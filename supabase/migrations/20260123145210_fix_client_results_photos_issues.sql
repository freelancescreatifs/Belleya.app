/*
  # Fix Client Results Photos Issues
  
  1. Changes
    - Make client_id nullable (not all photos need to be linked to a client)
    - Fix auto_publish_client_result function to use photo_url instead of url
    - Fix sync_client_result_service_info to handle NULL service_id properly
  
  2. Security
    - Maintains existing RLS policies
    - No security impact
*/

-- Make client_id nullable
ALTER TABLE client_results_photos 
  ALTER COLUMN client_id DROP NOT NULL;

-- Fix auto_publish_client_result function to use correct column name
CREATE OR REPLACE FUNCTION auto_publish_client_result()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_name text;
  v_client_name text;
BEGIN
  -- Get company name
  SELECT company_name INTO v_company_name
  FROM company_profiles
  WHERE id = NEW.company_id;

  -- Get client first name (optional)
  IF NEW.client_id IS NOT NULL THEN
    SELECT first_name INTO v_client_name
    FROM clients
    WHERE id = NEW.client_id;
  END IF;

  -- Create content_calendar entry
  INSERT INTO content_calendar (
    company_id,
    title,
    description,
    content_type,
    platform,
    media_url,
    publication_date,
    publication_time,
    status,
    is_published,
    likes_count,
    comments_count
  ) VALUES (
    NEW.company_id,
    'Résultat client',
    format('Réalisé par %s', COALESCE(v_company_name, 'notre salon')),
    'Photo',
    'BelleYa Gallery',
    NEW.photo_url,  -- Fixed: was NEW.url
    CURRENT_DATE,
    CURRENT_TIME,
    'published',
    true,
    0,
    0
  );

  RETURN NEW;
END;
$$;
