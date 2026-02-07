/*
  # Fix accept_booking - Retirer colonne source qui n'existe pas

  ## Problème identifié
  La table `clients` n'a PAS de colonne `source`
  Les colonnes obligatoires sont: user_id, first_name, last_name

  ## Solution
  - Retirer la colonne source de l'INSERT
  - Garder seulement les colonnes qui existent réellement dans clients
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

  -- 3. Obtenir les infos du client depuis user_profiles
  SELECT
    COALESCE(first_name, ''),
    COALESCE(last_name, ''),
    phone
  INTO v_first_name, v_last_name, v_phone
  FROM user_profiles
  WHERE user_id = v_booking.client_id;

  -- 4. Obtenir l'email depuis auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_booking.client_id;

  -- Si on n'a pas de first_name, utiliser l'email ou "Client"
  IF v_first_name IS NULL OR v_first_name = '' THEN
    v_first_name := COALESCE(SPLIT_PART(v_email, '@', 1), 'Client');
  END IF;

  IF v_last_name IS NULL OR v_last_name = '' THEN
    v_last_name := COALESCE(SPLIT_PART(v_email, '@', 2), '');
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
    INSERT INTO clients (
      company_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      status,
      notes
    ) VALUES (
      v_company_id,
      v_booking.client_id,
      v_first_name,
      v_last_name,
      COALESCE(v_email, ''),
      v_phone,
      'regular',
      'Client créé automatiquement lors de l''acceptation de la réservation'
    )
    RETURNING id INTO v_client_id;
  ELSE
    -- Mettre à jour le user_id si le client existait mais n'avait pas de user_id
    UPDATE clients
    SET updated_at = now()
    WHERE id = v_client_id;
  END IF;

  -- 6. Mettre à jour le statut du booking à confirmed
  -- Cela va déclencher le trigger add_booking_to_agenda qui crée l'event automatiquement
  UPDATE bookings
  SET
    status = 'confirmed',
    updated_at = now()
  WHERE id = p_booking_id;

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

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'message', 'Erreur lors de l''acceptation: ' || SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION accept_booking(uuid) TO authenticated;
