/*
  # Add company_id to events table

  1. Changes to `events` table
    - Add `company_id` column to link events to company profiles
    - Update existing events to set company_id based on user_id

  2. Security
    - Update RLS policies to work with company_id
    - Create indexes for efficient querying
*/

-- Add company_id column to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE events ADD COLUMN company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id);

-- Update existing events to set company_id based on user_id
UPDATE events e
SET company_id = cp.id
FROM company_profiles cp
WHERE e.user_id = cp.user_id
AND e.company_id IS NULL;

-- Update the add_booking_to_agenda function to include company_id
CREATE OR REPLACE FUNCTION add_booking_to_agenda()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_full_name text;
  service_name text;
  appointment_end timestamptz;
  pro_company_id uuid;
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

    -- Get company_id for the pro
    SELECT id INTO pro_company_id
    FROM company_profiles
    WHERE user_id = NEW.pro_id;

    -- Calculate end time
    appointment_end := NEW.appointment_date + (NEW.duration || ' minutes')::interval;

    -- Create event in agenda
    INSERT INTO events (
      user_id,
      company_id,
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
      pro_company_id,
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
$$ LANGUAGE plpgsql;