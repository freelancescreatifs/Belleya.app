/*
  # Fix Booking Acceptance System - RPC Transactionnelle

  ## Diagnostic du problème
  - Erreur 400 lors du chargement des bookings avec relation `user_profiles!bookings_client_id_fkey`
  - Le trigger `add_booking_to_agenda` crée l'event mais PAS le client
  - Le trigger `auto_create_client_on_booking` écoute `event_type='pro'` mais on insère `type='client'`

  ## Solution
  1. Créer une RPC transactionnelle `accept_booking` qui :
     - Vérifie que le booking existe et est pending
     - Change le statut à confirmed
     - Crée/trouve le client dans la table `clients`
     - Crée l'event dans l'agenda (via le trigger existant)
     - Retourne les données complètes

  2. Corriger le trigger `auto_create_client_on_booking` pour `type='client'`

  3. Ajouter une fonction helper pour obtenir company_id depuis user_id

  ## Tables impliquées
  - `bookings`: (client_id, pro_id, service_id, appointment_date, duration, price, status)
  - `clients`: (id, user_id, company_id, first_name, last_name, email, phone)
  - `events`: (user_id, company_id, type, title, start_at, end_at, client_id, service_id)
  - `user_profiles`: (user_id, first_name, last_name, phone)
  - `company_profiles`: (id, user_id)
*/

-- =============================================================================
-- 1. FONCTION RPC: accept_booking
-- =============================================================================

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
  v_user_profile record;
  v_user_email text;
  v_result jsonb;
BEGIN
  -- 1. Vérifier que le booking existe et est pending
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND status = 'pending'
    AND pro_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not pending, or you do not own this booking';
  END IF;

  -- 2. Obtenir le company_id du pro
  SELECT id INTO v_company_id
  FROM company_profiles
  WHERE user_id = auth.uid();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company profile not found for user';
  END IF;

  -- 3. Obtenir les infos du client depuis user_profiles et auth.users
  SELECT
    up.first_name,
    up.last_name,
    up.phone,
    au.email
  INTO v_user_profile
  FROM user_profiles up
  LEFT JOIN auth.users au ON au.id = up.user_id
  WHERE up.user_id = v_booking.client_id;

  -- Si pas de user_profile, utiliser l'email depuis auth.users
  IF v_user_profile.first_name IS NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_booking.client_id;

    v_user_profile.first_name := SPLIT_PART(COALESCE(v_user_email, 'Client'), '@', 1);
    v_user_profile.last_name := '';
    v_user_profile.phone := NULL;
    v_user_profile.email := v_user_email;
  END IF;

  -- 4. Créer ou trouver le client dans la table clients
  -- D'abord on cherche s'il existe déjà (par user_id ou email/phone)
  SELECT id INTO v_client_id
  FROM clients
  WHERE company_id = v_company_id
    AND (
      user_id = v_booking.client_id
      OR (email = v_user_profile.email AND email IS NOT NULL)
      OR (phone = v_user_profile.phone AND phone IS NOT NULL AND phone != '')
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
      source,
      notes
    ) VALUES (
      v_company_id,
      v_booking.client_id,
      COALESCE(v_user_profile.first_name, 'Client'),
      COALESCE(v_user_profile.last_name, ''),
      COALESCE(v_user_profile.email, ''),
      v_user_profile.phone,
      'active',
      'booking',
      'Client créé automatiquement lors de l''acceptation de la réservation'
    )
    RETURNING id INTO v_client_id;
  ELSE
    -- Mettre à jour le user_id si le client existait mais n'avait pas de user_id
    UPDATE clients
    SET user_id = v_booking.client_id,
        updated_at = now()
    WHERE id = v_client_id
      AND user_id IS NULL;
  END IF;

  -- 5. Mettre à jour le statut du booking à confirmed
  -- Cela va déclencher le trigger add_booking_to_agenda qui crée l'event automatiquement
  UPDATE bookings
  SET
    status = 'confirmed',
    updated_at = now()
  WHERE id = p_booking_id;

  -- 6. Récupérer l'event créé par le trigger
  SELECT id INTO v_event_id
  FROM events
  WHERE user_id = auth.uid()
    AND service_id = v_booking.service_id
    AND start_at = v_booking.appointment_date
    AND type = 'client'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 7. Mettre à jour l'event avec le client_id de la table clients
  IF v_event_id IS NOT NULL THEN
    UPDATE events
    SET client_id = v_client_id
    WHERE id = v_event_id;
  END IF;

  -- 8. Construire et retourner le résultat JSON
  SELECT jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'client_id', v_client_id,
    'event_id', v_event_id,
    'message', 'Réservation acceptée avec succès'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erreur lors de l''acceptation de la réservation'
    );
END;
$$;

-- =============================================================================
-- 2. CORRIGER LE TRIGGER auto_create_client_on_booking
-- =============================================================================

-- Supprimer l'ancien trigger qui écoutait event_type='pro'
DROP TRIGGER IF EXISTS trigger_auto_create_client_on_booking ON events;
DROP FUNCTION IF EXISTS auto_create_client_on_booking();

-- Nouvelle version qui écoute type='client' et qui est plus robuste
CREATE OR REPLACE FUNCTION auto_create_client_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_exists boolean;
  v_user_profile record;
  v_user_email text;
  v_company_id uuid;
BEGIN
  -- Seulement pour les events de type 'client' qui ont un client_id null
  -- (les nouveaux events depuis bookings)
  IF NEW.type != 'client' OR NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Si l'event a déjà un client_id (dans table clients), on ne fait rien
  IF NEW.client_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- On ne peut pas créer de client sans savoir qui c'est
  -- Cette fonction est maintenant désactivée car on crée les clients via accept_booking RPC
  -- Elle reste au cas où on aurait besoin de créer des events manuellement

  RETURN NEW;
END;
$$;

-- Réactiver le trigger mais il ne fera rien maintenant (logique désactivée)
CREATE TRIGGER trigger_auto_create_client_on_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_on_event();

-- =============================================================================
-- 3. FONCTION HELPER: get_company_id_for_user
-- =============================================================================

CREATE OR REPLACE FUNCTION get_company_id_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM company_profiles
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- =============================================================================
-- 4. VÉRIFIER QUE LA COLONNE company_id EXISTE DANS clients
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'company_id'
  ) THEN
    -- Ajouter company_id à clients s'il n'existe pas
    ALTER TABLE clients ADD COLUMN company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE;

    -- Créer un index
    CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);

    -- Peupler company_id pour les clients existants
    UPDATE clients c
    SET company_id = cp.id
    FROM company_profiles cp
    WHERE c.user_id = cp.user_id
    AND c.company_id IS NULL;
  END IF;
END $$;

-- =============================================================================
-- 5. AMÉLIORER LES POLICIES RLS POUR clients
-- =============================================================================

-- S'assurer que les pros peuvent créer des clients pour leur company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'clients'
    AND policyname = 'Pros can insert clients for their company'
  ) THEN
    CREATE POLICY "Pros can insert clients for their company"
      ON clients FOR INSERT
      TO authenticated
      WITH CHECK (
        company_id IN (
          SELECT id FROM company_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- S'assurer que les pros peuvent voir leurs clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'clients'
    AND policyname = 'Pros can view own company clients'
  ) THEN
    CREATE POLICY "Pros can view own company clients"
      ON clients FOR SELECT
      TO authenticated
      USING (
        company_id IN (
          SELECT id FROM company_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Permettre l'exécution de la RPC accept_booking aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION accept_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_id_for_user(uuid) TO authenticated;

-- =============================================================================
-- NOTES D'UTILISATION
-- =============================================================================

-- Côté frontend, utiliser la RPC comme ceci:
-- const { data, error } = await supabase.rpc('accept_booking', {
--   p_booking_id: 'uuid-du-booking'
-- });
--
-- Retour attendu:
-- {
--   success: true,
--   booking_id: 'uuid',
--   client_id: 'uuid',
--   event_id: 'uuid',
--   message: 'Réservation acceptée avec succès'
-- }
