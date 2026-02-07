/*
  # Calcul automatique des statuts cliente (Fidèle/VIP)

  1. Fonction de calcul automatique
    - `update_client_loyalty_status()` : calcule is_fidele et is_vip basé sur le nombre de RDV confirmés
    - Seuils :
      - Cliente fidèle : 5+ rendez-vous confirmés
      - Cliente VIP : 10+ rendez-vous confirmés
    - Priorité : VIP > Fidèle

  2. Trigger automatique
    - Déclenché après INSERT/UPDATE/DELETE sur events
    - Met à jour automatiquement les statuts des clientes concernées

  3. Initialisation
    - Met à jour tous les statuts existants selon la nouvelle logique

  4. Important
    - Les champs is_fidele et is_vip restent en base mais ne sont plus modifiables manuellement
    - Les statuts sont calculés uniquement sur les événements de type 'pro' et status 'confirmed'
*/

-- Fonction pour calculer et mettre à jour le statut d'une cliente
CREATE OR REPLACE FUNCTION update_client_loyalty_status(target_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  confirmed_count integer;
BEGIN
  -- Compter le nombre de rendez-vous confirmés pour cette cliente
  SELECT COUNT(*)
  INTO confirmed_count
  FROM events
  WHERE client_id = target_client_id
    AND type = 'pro'
    AND status = 'confirmed';

  -- Mettre à jour les statuts selon les seuils
  UPDATE clients
  SET
    is_vip = (confirmed_count >= 10),
    is_fidele = (confirmed_count >= 5 AND confirmed_count < 10),
    updated_at = now()
  WHERE id = target_client_id;
END;
$$;

-- Fonction trigger pour mettre à jour automatiquement après modification d'événement
CREATE OR REPLACE FUNCTION trigger_update_client_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si un événement est créé ou modifié avec un client_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.client_id IS NOT NULL THEN
    PERFORM update_client_loyalty_status(NEW.client_id);
  END IF;

  -- Si un événement est supprimé ou modifié (ancien client_id différent)
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id))
     AND OLD.client_id IS NOT NULL THEN
    PERFORM update_client_loyalty_status(OLD.client_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Créer le trigger sur la table events
DROP TRIGGER IF EXISTS auto_update_client_status_trigger ON events;
CREATE TRIGGER auto_update_client_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_client_status();

-- Recalculer tous les statuts existants
DO $$
DECLARE
  client_record RECORD;
BEGIN
  FOR client_record IN
    SELECT DISTINCT id FROM clients WHERE user_id IS NOT NULL
  LOOP
    PERFORM update_client_loyalty_status(client_record.id);
  END LOOP;
END $$;
