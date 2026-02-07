/*
  # Add Booking to Agenda on Accept

  1. New Function
    - `add_booking_to_agenda()` - Creates an event in the events table when a booking is confirmed

  2. Trigger
    - Automatically creates an agenda event when booking status changes to 'confirmed'

  3. Changes
    - When pro accepts a booking, it automatically appears in their agenda
    - The event includes all booking details (client, service, date, time)
*/

-- Function to create an event in agenda when booking is confirmed
CREATE OR REPLACE FUNCTION add_booking_to_agenda()
RETURNS TRIGGER AS $$
DECLARE
  client_full_name text;
  service_name text;
  appointment_end timestamptz;
BEGIN
  -- Only proceed if status changed to confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get client name
    SELECT COALESCE(first_name || ' ' || last_name, 'Client') INTO client_full_name
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    -- Get service name
    SELECT name INTO service_name
    FROM services
    WHERE id = NEW.service_id;

    -- Calculate end time
    appointment_end := NEW.appointment_date + (NEW.duration || ' minutes')::interval;

    -- Create event in agenda
    INSERT INTO events (
      user_id,
      type,
      title,
      start_at,
      end_at,
      client_id,
      service_id,
      notes,
      status
    ) VALUES (
      NEW.pro_id,
      'client',
      service_name || ' - ' || client_full_name,
      NEW.appointment_date,
      appointment_end,
      NULL,
      NEW.service_id,
      COALESCE('Réservation en ligne' || CASE WHEN NEW.notes IS NOT NULL AND NEW.notes != '' THEN E'\n\nNotes client: ' || NEW.notes ELSE '' END, 'Réservation en ligne'),
      'confirmed'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add booking to agenda
DROP TRIGGER IF EXISTS on_booking_confirmed_add_to_agenda ON bookings;
CREATE TRIGGER on_booking_confirmed_add_to_agenda
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION add_booking_to_agenda();

-- Also handle when a booking is cancelled (remove from agenda)
CREATE OR REPLACE FUNCTION remove_booking_from_agenda()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking is cancelled, we could optionally update the event status
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    
    -- Update any matching events to cancelled status
    UPDATE events
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n\n[Réservation annulée: ' || COALESCE(NEW.cancellation_reason, 'Non spécifié') || ']'
    WHERE user_id = NEW.pro_id
      AND service_id = NEW.service_id
      AND start_at = NEW.appointment_date
      AND type = 'client'
      AND status = 'confirmed';

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle cancellations
DROP TRIGGER IF EXISTS on_booking_cancelled_update_agenda ON bookings;
CREATE TRIGGER on_booking_cancelled_update_agenda
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION remove_booking_from_agenda();