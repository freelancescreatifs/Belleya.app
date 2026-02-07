/*
  # Mettre à jour les fonctions de booking pour utiliser 'pro' au lieu de 'client'

  1. Modifications
    - Met à jour la fonction `add_booking_to_agenda()` pour créer des événements de type 'pro'
    - Met à jour la fonction `remove_booking_from_agenda()` pour filtrer les événements de type 'pro'

  2. Impact
    - Les futurs bookings confirmés créeront des événements 'pro'
    - Les annulations mettront à jour les événements 'pro'
*/

-- Mettre à jour la fonction pour créer des événements de type 'pro'
CREATE OR REPLACE FUNCTION add_booking_to_agenda()
RETURNS TRIGGER AS $$
DECLARE
  client_full_name text;
  service_name text;
  appointment_end timestamptz;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    SELECT COALESCE(first_name || ' ' || last_name, 'Client') INTO client_full_name
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    SELECT name INTO service_name
    FROM services
    WHERE id = NEW.service_id;

    appointment_end := NEW.appointment_date + (NEW.duration || ' minutes')::interval;

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
      'pro',
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

-- Mettre à jour la fonction pour gérer les annulations avec type 'pro'
CREATE OR REPLACE FUNCTION remove_booking_from_agenda()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    
    UPDATE events
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n\n[Réservation annulée: ' || COALESCE(NEW.cancellation_reason, 'Non spécifié') || ']'
    WHERE user_id = NEW.pro_id
      AND service_id = NEW.service_id
      AND start_at = NEW.appointment_date
      AND type = 'pro'
      AND status = 'confirmed';

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
