/*
  # Booking Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, recipient) - who receives the notification
      - `type` (text) - type of notification: 'booking_request', 'booking_confirmed', 'booking_rejected', etc.
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `booking_id` (uuid, nullable) - related booking if applicable
      - `is_read` (boolean) - whether notification has been read
      - `action_url` (text, nullable) - optional URL to navigate to
      - `metadata` (jsonb, nullable) - additional data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for users to update their own notifications (mark as read)

  3. Triggers
    - Create trigger on bookings table to auto-create notification for pro when booking is created
    - Create trigger on bookings table to notify client when booking status changes

  4. Functions
    - Function to create booking notification for pro
    - Function to create booking status notification for client
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'booking_completed', 'booking_cancelled', 'info', 'reminder')),
  title text NOT NULL,
  message text NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to notify pro of new booking request
CREATE OR REPLACE FUNCTION notify_pro_of_booking()
RETURNS TRIGGER AS $$
DECLARE
  client_name text;
  service_name text;
  booking_date text;
BEGIN
  -- Get client name
  SELECT COALESCE(up.first_name || ' ' || up.last_name, 'Client') INTO client_name
  FROM user_profiles up
  WHERE up.user_id = NEW.client_id;

  -- Get service name
  SELECT name INTO service_name
  FROM services
  WHERE id = NEW.service_id;

  -- Format booking date
  booking_date := to_char(NEW.appointment_date, 'DD/MM/YYYY à HH24:MI');

  -- Create notification for pro
  INSERT INTO notifications (user_id, type, title, message, booking_id)
  VALUES (
    NEW.pro_id,
    'booking_request',
    'Nouvelle demande de réservation',
    client_name || ' souhaite réserver ' || service_name || ' le ' || booking_date,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify client of booking status change
CREATE OR REPLACE FUNCTION notify_client_of_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  pro_name text;
  service_name text;
  booking_date text;
  notification_type text;
  notification_title text;
  notification_message text;
BEGIN
  -- Only notify on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get pro business name
  SELECT company_name INTO pro_name
  FROM company_profiles
  WHERE user_id = NEW.pro_id;

  -- Get service name
  SELECT name INTO service_name
  FROM services
  WHERE id = NEW.service_id;

  -- Format booking date
  booking_date := to_char(NEW.appointment_date, 'DD/MM/YYYY à HH24:MI');

  -- Determine notification type and message based on status
  IF NEW.status = 'confirmed' THEN
    notification_type := 'booking_confirmed';
    notification_title := 'Réservation confirmée';
    notification_message := pro_name || ' a confirmé votre réservation pour ' || service_name || ' le ' || booking_date;
  ELSIF NEW.status = 'cancelled' THEN
    notification_type := 'booking_cancelled';
    notification_title := 'Réservation annulée';
    notification_message := 'Votre réservation pour ' || service_name || ' le ' || booking_date || ' a été annulée.';
    IF NEW.cancellation_reason IS NOT NULL THEN
      notification_message := notification_message || ' Raison: ' || NEW.cancellation_reason;
    END IF;
  ELSIF NEW.status = 'completed' THEN
    notification_type := 'booking_completed';
    notification_title := 'Rendez-vous terminé';
    notification_message := 'Votre rendez-vous chez ' || pro_name || ' est terminé. N''oubliez pas de laisser un avis !';
  ELSE
    RETURN NEW;
  END IF;

  -- Create notification for client
  INSERT INTO notifications (user_id, type, title, message, booking_id)
  VALUES (
    NEW.client_id,
    notification_type,
    notification_title,
    notification_message,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new bookings (notify pro)
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_pro_of_booking();

-- Create trigger for booking status changes (notify client)
DROP TRIGGER IF EXISTS on_booking_status_changed ON bookings;
CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_of_booking_status();

-- Function to auto-create CRM client entry when client books for the first time
CREATE OR REPLACE FUNCTION auto_create_crm_client()
RETURNS TRIGGER AS $$
DECLARE
  client_exists boolean;
  client_first_name text;
  client_last_name text;
  client_email text;
  client_phone text;
BEGIN
  -- Check if CRM client entry already exists
  SELECT EXISTS(
    SELECT 1 FROM crm_clients
    WHERE pro_id = NEW.pro_id AND user_id = NEW.client_id
  ) INTO client_exists;

  -- If not exists, create it
  IF NOT client_exists THEN
    -- Get client info from user_profiles
    SELECT first_name, last_name, phone INTO client_first_name, client_last_name, client_phone
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    -- Get email from auth.users
    SELECT email INTO client_email
    FROM auth.users
    WHERE id = NEW.client_id;

    -- Insert CRM client
    INSERT INTO crm_clients (
      pro_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      first_visit_date,
      last_visit_date,
      total_visits,
      total_spent
    ) VALUES (
      NEW.pro_id,
      NEW.client_id,
      COALESCE(client_first_name, ''),
      COALESCE(client_last_name, ''),
      COALESCE(client_email, ''),
      client_phone,
      CURRENT_DATE,
      CURRENT_DATE,
      0,
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create CRM client
DROP TRIGGER IF EXISTS on_booking_create_crm_client ON bookings;
CREATE TRIGGER on_booking_create_crm_client
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_crm_client();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pro_id_status ON bookings(pro_id, status);