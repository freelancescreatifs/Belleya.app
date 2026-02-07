/*
  # Fix auto_publish_client_result function to use valid content_type

  1. Changes
    - Update auto_publish_client_result() function to use 'post' instead of 'Photo' for content_type
    - This matches the constraint on content_calendar table
*/

CREATE OR REPLACE FUNCTION auto_publish_client_result()
RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_user_id UUID;
BEGIN
  -- Get company name and user_id
  SELECT company_name, user_id INTO v_company_name, v_user_id
  FROM company_profiles
  WHERE id = NEW.company_id;

  -- Auto-publish to content_calendar feed if show_in_gallery is true
  IF NEW.show_in_gallery = true THEN
    INSERT INTO content_calendar (
      user_id,
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
      v_user_id,
      NEW.company_id,
      'Résultat client',
      format('Réalisé par %s', COALESCE(v_company_name, 'notre salon')),
      'post',
      'instagram',
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
