/*
  # Ajouter les paramètres de réservation au profil d'entreprise

  1. Nouvelles colonnes
    - `default_appointment_duration` (integer) - Durée par défaut des RDV en minutes
    - `advance_booking_hours` (integer) - Délai minimum de préavis pour réserver (en heures)
    - `buffer_time_minutes` (integer) - Temps de pause entre les RDV (en minutes)
    - `max_bookings_per_day` (integer) - Nombre maximum de réservations par jour
    - `auto_accept_bookings` (boolean) - Accepter automatiquement les réservations
    - `email_notifications` (boolean) - Recevoir des notifications par email
    - `sms_notifications` (boolean) - Recevoir des notifications par SMS
    - `welcome_message` (text) - Message d'accueil personnalisé pour les clientes
    - `booking_instructions` (text) - Instructions spéciales pour les réservations
    - `cancellation_policy` (text) - Politique d'annulation
    - `deposit_required` (boolean) - Demander un acompte
    - `deposit_amount` (numeric) - Montant de l'acompte

  2. Valeurs par défaut
    - Durée par défaut: 60 minutes
    - Préavis: 24 heures
    - Temps de pause: 15 minutes
    - Max réservations: null (illimité)
    - Auto-acceptation: false (validation manuelle)
    - Notifications email: true
    - Notifications SMS: false
    - Acompte requis: false
*/

DO $$
BEGIN
  -- Durée par défaut des RDV
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'default_appointment_duration'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN default_appointment_duration integer DEFAULT 60;
  END IF;

  -- Délai minimum de réservation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'advance_booking_hours'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN advance_booking_hours integer DEFAULT 24;
  END IF;

  -- Temps de pause entre RDV
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'buffer_time_minutes'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN buffer_time_minutes integer DEFAULT 15;
  END IF;

  -- Nombre max de réservations par jour
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'max_bookings_per_day'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN max_bookings_per_day integer;
  END IF;

  -- Auto-acceptation des réservations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'auto_accept_bookings'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN auto_accept_bookings boolean DEFAULT false;
  END IF;

  -- Notifications email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN email_notifications boolean DEFAULT true;
  END IF;

  -- Notifications SMS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'sms_notifications'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN sms_notifications boolean DEFAULT false;
  END IF;

  -- Message d'accueil
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'welcome_message'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN welcome_message text;
  END IF;

  -- Instructions de réservation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'booking_instructions'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN booking_instructions text;
  END IF;

  -- Politique d'annulation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'cancellation_policy'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN cancellation_policy text;
  END IF;

  -- Acompte requis
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'deposit_required'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN deposit_required boolean DEFAULT false;
  END IF;

  -- Montant de l'acompte
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN deposit_amount numeric(10, 2);
  END IF;
END $$;