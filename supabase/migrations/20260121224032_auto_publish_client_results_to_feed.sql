/*
  # Auto-publish client results to social feed

  ## Overview
  When a professional uploads a photo in "Ses résultats" (client_results_photos),
  automatically create an entry in content_calendar with is_published=true so it
  appears in the client social feed with likes and comments.

  ## Changes
  - Create trigger function to auto-create content_calendar entry
  - Create trigger on client_results_photos INSERT

  ## Notes
  - This links the gallery system to the social feed system
  - Photos in "Ses résultats" become social posts automatically
  - Professionals can still manually create content in the Content module
*/

-- Function to auto-create content_calendar entry when client result photo is uploaded
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
  SELECT first_name INTO v_client_name
  FROM clients
  WHERE id = NEW.client_id;

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
    NEW.url,
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_publish_client_result ON client_results_photos;
CREATE TRIGGER trigger_auto_publish_client_result
  AFTER INSERT ON client_results_photos
  FOR EACH ROW
  EXECUTE FUNCTION auto_publish_client_result();
