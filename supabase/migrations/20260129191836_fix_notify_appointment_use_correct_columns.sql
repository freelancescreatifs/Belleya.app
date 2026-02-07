/*
  # Fix notify_new_appointment_request - Utiliser les bonnes colonnes

  ## Problème
  La fonction `notify_new_appointment_request()` utilise:
  - `NEW.event_type` → devrait être `NEW.type`
  - `NEW.start_time` → devrait être `NEW.start_at`
  - `NEW.end_time` → devrait être `NEW.end_at`

  ## Solution
  Corriger tous les noms de colonnes pour correspondre à la structure réelle de la table events
*/

CREATE OR REPLACE FUNCTION notify_new_appointment_request()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_provider_id uuid;
  v_company_id uuid;
  v_client_name text;
  v_service_name text;
BEGIN
  -- Only for pending pro appointments
  -- ✅ Utiliser NEW.type au lieu de NEW.event_type
  IF NEW.type != 'pro' OR NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get provider user_id and company_id
  SELECT up.user_id, up.company_id INTO v_provider_id, v_company_id
  FROM user_profiles up
  WHERE up.company_id = NEW.company_id
  AND up.role = 'admin'
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client name
  SELECT first_name || ' ' || last_name INTO v_client_name
  FROM clients
  WHERE id = NEW.client_id;

  -- Get service name if available
  SELECT name INTO v_service_name
  FROM services
  WHERE id = NEW.service_id;

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
    v_provider_id,
    v_company_id,
    'appointment_request',
    'Nouvelle demande de rendez-vous',
    format('%s souhaite prendre rendez-vous%s le %s',
      COALESCE(v_client_name, 'Un client'),
      CASE WHEN v_service_name IS NOT NULL THEN ' pour ' || v_service_name ELSE '' END,
      -- ✅ Utiliser start_at au lieu de start_time
      to_char(NEW.start_at, 'DD/MM/YYYY à HH24:MI')
    ),
    'events',
    NEW.id,
    '/agenda',
    jsonb_build_object(
      'client_name', v_client_name,
      'service_name', v_service_name,
      -- ✅ Utiliser start_at et end_at au lieu de start_time et end_time
      'start_at', NEW.start_at,
      'end_at', NEW.end_at
    )
  );

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_notify_new_appointment_request ON events;
CREATE TRIGGER trigger_notify_new_appointment_request
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment_request();
