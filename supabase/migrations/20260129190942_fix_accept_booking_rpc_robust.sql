/*
  # Fix accept_booking RPC - Version plus robuste

  ## Problème
  La fonction accept_booking peut échouer si:
  - user_profiles n'existe pas pour le client
  - Les colonnes first_name/last_name n'existent pas
  - Le LEFT JOIN échoue
  - La table user_profiles s'appelle profiles

  ## Solution
  - Simplifier la requête pour être plus robuste
  - Utiliser la table profiles au lieu de user_profiles
  - Gérer tous les cas d'erreur
  - Ajouter des logs pour débugger
*/

CREATE OR REPLACE FUNCTION accept_booking(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_client_id uuid;
  v_event_id uuid;
  v_company_id uuid;
  v_first_name text;
  v_last_name text;
  v_phone text;
  v_email text;
  v_result jsonb;
BEGIN
  -- 1. Vérifier que le booking existe et est pending
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND status = 'pending'
    AND pro_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found or not pending, or you do not own this booking',
      'message', 'Réservation introuvable ou déjà traitée'
    );
  END IF;

  -- 2. Obtenir le company_id du pro
  SELECT id INTO v_company_id
  FROM company_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Company profile not found',
      'message', 'Profil entreprise introuvable'
    );
  END IF;

  -- 3. Obtenir les infos du client depuis user_profiles OU profiles
  -- On essaie d'abord user_profiles, sinon profiles
  BEGIN
    SELECT
      COALESCE(first_name, ''),
      COALESCE(last_name, ''),
      phone
    INTO v_first_name, v_last_name, v_phone
    FROM user_profiles
    WHERE user_id = v_booking.client_id;
  EXCEPTION WHEN OTHERS THEN
    -- Si user_profiles n'existe pas, essayer profiles
    BEGIN
      SELECT
        COALESCE(first_name, ''),
        COALESCE(last_name, ''),
        phone
      INTO v_first_name, v_last_name, v_phone
      FROM profiles
      WHERE id = v_booking.client_id;
    EXCEPTION WHEN OTHERS THEN
      -- Si aucune table ne fonctionne, on prend juste l'email
      v_first_name := NULL;
      v_last_name := NULL;
      v_phone := NULL;
    END;
  END;

  -- 4. Obtenir l'email depuis auth.users
  BEGIN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_booking.client_id;
  EXCEPTION WHEN OTHERS THEN
    v_email := NULL;
  END;

  -- Si on n'a pas de first_name, utiliser l'email ou "Client"
  IF v_first_name IS NULL OR v_first_name = '' THEN
    v_first_name := COALESCE(SPLIT_PART(v_email, '@', 1), 'Client');
  END IF;

  IF v_last_name IS NULL THEN
    v_last_name := '';
  END IF;

  -- 5. Créer ou trouver le client dans la table clients
  SELECT id INTO v_client_id
  FROM clients
  WHERE company_id = v_company_id
    AND (
      user_id = v_booking.client_id
      OR (email = v_email AND v_email IS NOT NULL AND v_email != '')
      OR (phone = v_phone AND v_phone IS NOT NULL AND v_phone != '')
    )
  LIMIT 1;

  -- Si le client n'existe pas, on le crée
  IF v_client_id IS NULL THEN
    BEGIN
      INSERT INTO clients (
        company_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status,
        source,
        notes
      ) VALUES (
        v_company_id,
        v_booking.client_id,
        v_first_name,
        v_last_name,
        COALESCE(v_email, ''),
        v_phone,
        'active',
        'booking',
        'Client créé automatiquement lors de l''acceptation de la réservation'
      )
      RETURNING id INTO v_client_id;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Erreur lors de la création du client: ' || SQLERRM
      );
    END;
  ELSE
    -- Mettre à jour le user_id si le client existait mais n'avait pas de user_id
    UPDATE clients
    SET user_id = v_booking.client_id,
        updated_at = now()
    WHERE id = v_client_id
      AND user_id IS NULL;
  END IF;

  -- 6. Mettre à jour le statut du booking à confirmed
  -- Cela va déclencher le trigger add_booking_to_agenda qui crée l'event automatiquement
  BEGIN
    UPDATE bookings
    SET
      status = 'confirmed',
      updated_at = now()
    WHERE id = p_booking_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erreur lors de la mise à jour du booking: ' || SQLERRM
    );
  END;

  -- 7. Récupérer l'event créé par le trigger
  SELECT id INTO v_event_id
  FROM events
  WHERE user_id = auth.uid()
    AND service_id = v_booking.service_id
    AND start_at = v_booking.appointment_date
    AND type = 'client'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 8. Mettre à jour l'event avec le client_id de la table clients
  IF v_event_id IS NOT NULL THEN
    UPDATE events
    SET client_id = v_client_id
    WHERE id = v_event_id;
  END IF;

  -- 9. Construire et retourner le résultat JSON
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'client_id', v_client_id,
    'event_id', v_event_id,
    'message', 'Réservation acceptée avec succès'
  );

END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION accept_booking(uuid) TO authenticated;
