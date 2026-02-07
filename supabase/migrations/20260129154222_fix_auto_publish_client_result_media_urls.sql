/*
  # Fix auto_publish_client_result function to use media_urls

  1. Changes
    - Update auto_publish_client_result() function to use media_urls (jsonb array) instead of media_url (text)
    - This fixes the error when inserting client_results_photos
*/

CREATE OR REPLACE FUNCTION auto_publish_client_result()
RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
BEGIN
  -- Get company name
  SELECT company_name INTO v_company_name
  FROM company_profiles
  WHERE id = NEW.company_id;

  -- Auto-publish to content_calendar feed if show_in_gallery is true
  IF NEW.show_in_gallery = true THEN
    INSERT INTO content_calendar (
      company_id,
      title,
      description,
      content_type,
      platform,
      media_urls,
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
      jsonb_build_array(NEW.photo_url),
      CURRENT_DATE,
      CURRENT_TIME,
      'published',
      true,
      0,
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
