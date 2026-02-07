/*
  # Activer la cascade automatique lors du décochage

  1. Problème
    - La fonction cascade_production_steps existe mais n'est jamais déclenchée automatiquement
    - Quand l'utilisateur décoche une étape, les étapes suivantes ne se décochent pas

  2. Solution
    - Créer un trigger BEFORE UPDATE qui détecte quand une date de production est décochée (devient NULL)
    - Appeler cascade_production_steps pour décocher automatiquement toutes les étapes suivantes

  3. Comportement
    - Décocher script → décoche tout (script, tournage, montage, planifié)
    - Décocher tournage → décoche tournage, montage, planifié (garde script)
    - Décocher montage → décoche montage, planifié (garde script, tournage)
    - Décocher planifié → décoche seulement planifié
*/

-- Créer la fonction trigger qui détecte les décochages
CREATE OR REPLACE FUNCTION trigger_cascade_on_uncheck()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_in_cascade text;
BEGIN
  -- Vérifier si on est déjà dans une cascade (éviter les boucles)
  v_in_cascade := current_setting('app.in_production_cascade', true);
  IF v_in_cascade = 'true' THEN
    RETURN NEW;
  END IF;

  -- Détecter si une date de production a été décochée (passée de non-NULL à NULL)
  
  -- Script décoché
  IF OLD.date_script IS NOT NULL AND NEW.date_script IS NULL THEN
    PERFORM cascade_production_steps(NEW.id, 'script', false);
    RETURN NEW;
  END IF;

  -- Tournage décoché
  IF OLD.date_shooting IS NOT NULL AND NEW.date_shooting IS NULL THEN
    PERFORM cascade_production_steps(NEW.id, 'shooting', false);
    RETURN NEW;
  END IF;

  -- Montage décoché
  IF OLD.date_editing IS NOT NULL AND NEW.date_editing IS NULL THEN
    PERFORM cascade_production_steps(NEW.id, 'editing', false);
    RETURN NEW;
  END IF;

  -- Planifié décoché
  IF OLD.date_scheduling IS NOT NULL AND NEW.date_scheduling IS NULL THEN
    PERFORM cascade_production_steps(NEW.id, 'scheduling', false);
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger BEFORE UPDATE pour intercepter les décochages
DROP TRIGGER IF EXISTS trigger_auto_cascade_uncheck ON content_calendar;
CREATE TRIGGER trigger_auto_cascade_uncheck
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cascade_on_uncheck();

COMMENT ON FUNCTION trigger_cascade_on_uncheck IS
'Détecte automatiquement quand une étape de production est décochée et déclenche la cascade forward pour décocher toutes les étapes suivantes';
