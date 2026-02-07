/*
  # Create Review Notification Triggers

  ## Overview
  Automatically create notifications when:
  - A new review is received by a provider

  ## Changes
  1. Add is_validated and validated_at columns to provider_reviews (if not exists)
  2. Create trigger for new reviews

  ## Notes
  - Notifications are sent to the provider
  - Reviews can be validated or rejected via notifications
*/

-- Add is_validated column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_reviews' AND column_name = 'is_validated'
  ) THEN
    ALTER TABLE provider_reviews ADD COLUMN is_validated boolean DEFAULT true;
  END IF;
END $$;

-- Add validated_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_reviews' AND column_name = 'validated_at'
  ) THEN
    ALTER TABLE provider_reviews ADD COLUMN validated_at timestamptz;
  END IF;
END $$;

-- Function to notify provider of new review
CREATE OR REPLACE FUNCTION notify_new_review()
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

  -- Get client info from user_profiles
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
    'review_received',
    'Nouvel avis reçu',
    format('%s vous a laissé un avis de %s étoiles%s',
      COALESCE(v_client_name, 'Un client'),
      NEW.rating,
      CASE WHEN NEW.comment IS NOT NULL AND NEW.comment != '' THEN ': "' || LEFT(NEW.comment, 100) || '"' ELSE '' END
    ),
    'provider_reviews',
    NEW.id,
    '/clients',
    jsonb_build_object(
      'client_name', v_client_name,
      'client_photo', v_client_photo,
      'rating', NEW.rating,
      'comment', NEW.comment
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS trigger_notify_new_review ON provider_reviews;
CREATE TRIGGER trigger_notify_new_review
  AFTER INSERT ON provider_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();
