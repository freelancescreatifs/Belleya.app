/*
  # Create Social Actions Notification Triggers

  ## Overview
  Automatically create notifications when:
  - A client follows a provider (new_follower)
  - A client likes a provider's content (new_like)

  ## Triggers
  - Create notification on INSERT to provider_follows
  - Create notification on INSERT to social_feed_likes

  ## Notes
  - Notifications are sent to the provider
  - Uses SECURITY DEFINER to bypass RLS
*/

-- Function to notify provider of new follower
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_provider_user_id uuid;
  v_company_id uuid;
  v_client_name text;
  v_client_photo text;
BEGIN
  -- Get provider user_id and company_id
  SELECT up.id, up.company_id INTO v_provider_user_id, v_company_id
  FROM user_profiles up
  WHERE up.id = NEW.provider_id
  LIMIT 1;

  IF v_provider_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client info
  SELECT full_name, avatar_url INTO v_client_name, v_client_photo
  FROM user_profiles
  WHERE id = NEW.client_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url,
    metadata
  ) VALUES (
    v_provider_user_id,
    v_company_id,
    'new_follower',
    'Nouvel abonné',
    format('%s s''est abonné à votre profil',
      COALESCE(v_client_name, 'Un client')
    ),
    'provider_follows',
    NEW.id,
    '/clients',
    jsonb_build_object(
      'client_id', NEW.client_id,
      'client_name', v_client_name,
      'client_photo', v_client_photo
    )
  );

  RETURN NEW;
END;
$$;

-- Function to notify provider of new like
CREATE OR REPLACE FUNCTION notify_new_like()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_provider_user_id uuid;
  v_company_id uuid;
  v_client_name text;
  v_photo_url text;
  v_content_title text;
BEGIN
  -- Get provider user_id and company_id from the social feed
  SELECT up.id, up.company_id, sf.photo_url, sf.title
  INTO v_provider_user_id, v_company_id, v_photo_url, v_content_title
  FROM social_feed sf
  JOIN user_profiles up ON up.company_id = sf.company_id
  WHERE sf.id = NEW.post_id
  AND up.role = 'admin'
  LIMIT 1;

  IF v_provider_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client info
  SELECT full_name INTO v_client_name
  FROM user_profiles
  WHERE id = NEW.client_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url,
    metadata
  ) VALUES (
    v_provider_user_id,
    v_company_id,
    'new_like',
    'Nouveau j''aime',
    format('%s a aimé %s',
      COALESCE(v_client_name, 'Un client'),
      CASE 
        WHEN v_content_title IS NOT NULL THEN v_content_title
        ELSE 'votre publication'
      END
    ),
    'social_feed_likes',
    NEW.id,
    '/content',
    jsonb_build_object(
      'client_id', NEW.client_id,
      'client_name', v_client_name,
      'post_id', NEW.post_id,
      'photo_url', v_photo_url,
      'content_title', v_content_title
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new followers
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON provider_follows;
CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON provider_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- Create trigger for new likes
DROP TRIGGER IF EXISTS trigger_notify_new_like ON social_feed_likes;
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON social_feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_like();
