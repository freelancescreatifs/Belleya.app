/*
  # Fix auto_publish_client_result trigger - platform array

  1. Bug Fix
    - The `auto_publish_client_result()` trigger was inserting a plain string
      `'instagram'` into the `platform` column of `content_calendar`
    - The `platform` column is of type `text[]` (array), not `text`
    - This caused: `malformed array literal: "instagram"` when uploading gallery photos

  2. Changes
    - Updated the trigger function to use `ARRAY['instagram']::text[]` instead of `'instagram'`
*/

CREATE OR REPLACE FUNCTION auto_publish_client_result()
RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_user_id UUID;
BEGIN
  SELECT company_name, user_id INTO v_company_name, v_user_id
  FROM company_profiles
  WHERE id = NEW.company_id;

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
      'Resultat client',
      format('Realise par %s', COALESCE(v_company_name, 'notre salon')),
      'post',
      ARRAY['instagram']::text[],
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
