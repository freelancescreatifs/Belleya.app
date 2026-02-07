/*
  # Social Feed & Notification System for Clients v2

  ## Overview
  This migration creates the social interaction features that connect clients with their favorite providers:
  - Like and comment system for published content
  - Comprehensive notification system for clients
  - Automatic notification triggers for key events

  ## New Tables

  ### `content_likes`
  Stores likes from users on published content
  - `id` (uuid, primary key)
  - `content_id` (uuid, FK to content_calendar)
  - `user_id` (uuid, FK to auth.users) - matches the pattern used in bookings
  - `created_at` (timestamptz)

  ### `content_comments`
  Stores comments from users on published content
  - `id` (uuid, primary key)
  - `content_id` (uuid, FK to content_calendar)
  - `user_id` (uuid, FK to auth.users)
  - `comment_text` (text)
  - `created_at` (timestamptz)

  ### `client_notifications`
  Stores all notifications for clients (booking confirmations, reminders, new content, etc.)
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users) - the client user receiving the notification
  - `notification_type` (text): booking confirmations, reminders, new content, etc.
  - `title` (text)
  - `message` (text)
  - `related_booking_id` (uuid, nullable FK to bookings)
  - `related_content_id` (uuid, nullable FK to content_calendar)
  - `related_provider_id` (uuid, nullable FK to company_profiles)
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all new tables
  - Users can only see/modify their own likes, comments, and notifications
  - Users can only interact with published content

  ## Triggers
  - Auto-create notification when booking status changes
  - Auto-create notification when followed provider publishes content
*/

-- Create content_likes table
CREATE TABLE IF NOT EXISTS content_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_calendar(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, user_id)
);

-- Create content_comments table
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_calendar(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create client_notifications table
CREATE TABLE IF NOT EXISTS client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'booking_confirmed',
    'booking_rejected',
    'booking_reminder',
    'new_content',
    'new_availability',
    'provider_message'
  )),
  title text NOT NULL,
  message text NOT NULL,
  related_booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  related_content_id uuid REFERENCES content_calendar(id) ON DELETE CASCADE,
  related_provider_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_user ON content_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_user ON client_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_unread ON client_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_client_notifications_type ON client_notifications(notification_type);

-- Enable RLS
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_likes
CREATE POLICY "Users can view all likes on published content"
  ON content_likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_likes.content_id
      AND content_calendar.is_published = true
    )
  );

CREATE POLICY "Users can like published content"
  ON content_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_id
      AND content_calendar.is_published = true
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON content_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for content_comments
CREATE POLICY "Anyone can view comments on published content"
  ON content_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_comments.content_id
      AND content_calendar.is_published = true
    )
  );

CREATE POLICY "Users can comment on published content"
  ON content_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_id
      AND content_calendar.is_published = true
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON content_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON content_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for client_notifications
CREATE POLICY "Users can view their own notifications"
  ON client_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON client_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON client_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to create notification when booking status changes
CREATE OR REPLACE FUNCTION notify_client_booking_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_title text;
  v_message text;
  v_type text;
  v_company_name text;
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('confirmed', 'rejected') THEN
    SELECT company_name INTO v_company_name
    FROM company_profiles cp
    JOIN user_profiles up ON up.company_id = cp.id
    WHERE up.user_id = NEW.pro_id;

    IF NEW.status = 'confirmed' THEN
      v_type := 'booking_confirmed';
      v_title := 'Réservation confirmée !';
      v_message := format(
        '%s a confirmé votre réservation pour le %s à %s.',
        COALESCE(v_company_name, 'Le prestataire'),
        to_char(NEW.appointment_date, 'DD/MM/YYYY'),
        to_char(NEW.appointment_date, 'HH24:MI')
      );
    ELSIF NEW.status = 'rejected' THEN
      v_type := 'booking_rejected';
      v_title := 'Réservation refusée';
      v_message := format(
        '%s ne peut pas honorer votre réservation. Veuillez choisir un autre créneau.',
        COALESCE(v_company_name, 'Le prestataire')
      );
    END IF;

    INSERT INTO client_notifications (
      user_id,
      notification_type,
      title,
      message,
      related_booking_id,
      related_provider_id
    )
    SELECT
      NEW.client_id,
      v_type,
      v_title,
      v_message,
      NEW.id,
      cp.id
    FROM user_profiles up
    JOIN company_profiles cp ON cp.id = up.company_id
    WHERE up.user_id = NEW.pro_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_client_booking_status ON bookings;
CREATE TRIGGER trigger_notify_client_booking_status
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_booking_status_change();

-- Function to notify followers when new content is published
CREATE OR REPLACE FUNCTION notify_followers_new_content()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_name text;
  v_follower_record RECORD;
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    SELECT company_name INTO v_company_name
    FROM company_profiles
    WHERE id = NEW.company_id;

    FOR v_follower_record IN
      SELECT DISTINCT c.user_id
      FROM client_favorites cf
      JOIN clients c ON c.id = cf.client_id
      WHERE cf.provider_id = NEW.company_id
    LOOP
      INSERT INTO client_notifications (
        user_id,
        notification_type,
        title,
        message,
        related_content_id,
        related_provider_id
      ) VALUES (
        v_follower_record.user_id,
        'new_content',
        'Nouveau contenu !',
        format('%s a publié un nouveau contenu.', v_company_name),
        NEW.id,
        NEW.company_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_followers_new_content ON content_calendar;
CREATE TRIGGER trigger_notify_followers_new_content
  AFTER UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_new_content();

-- Add likes_count and comments_count to content_calendar for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN comments_count integer DEFAULT 0;
  END IF;
END $$;

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_content_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_calendar
    SET likes_count = likes_count + 1
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_calendar
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.content_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_likes_count ON content_likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON content_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_content_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_content_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_calendar
    SET comments_count = comments_count + 1
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_calendar
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.content_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_comments_count ON content_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_content_comments_count();
