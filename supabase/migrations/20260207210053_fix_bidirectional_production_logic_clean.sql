/*
  # Logique bidirectionnelle propre pour les étapes de production

  1. Problème actuel
    - Multiples triggers qui se marchent dessus
    - Quand on décoche Script, il se recoche automatiquement
    - Boucles infinies entre les triggers

  2. Solution
    - UN SEUL trigger BEFORE UPDATE qui gère TOUT
    - Règle 1 (cochage/escalier montant) : cocher une étape → cocher toutes les précédentes
    - Règle 2 (décochage/cascade descendante) : décocher une étape → décocher toutes les suivantes
    - Protection anti-boucle avec flag de session

  3. Ordre des étapes
    Script → Tournage → Montage → Planifié (validation n'existe pas dans la table)
*/

-- Désactiver tous les triggers existants qui causent des conflits
DROP TRIGGER IF EXISTS trigger_auto_cascade_uncheck ON content_calendar;
DROP TRIGGER IF EXISTS trigger_sync_production_tasks_update ON content_calendar;
DROP TRIGGER IF EXISTS trigger_cascade_on_uncheck ON content_calendar;

-- Fonction unique qui gère la logique bidirectionnelle
CREATE OR REPLACE FUNCTION handle_production_steps_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_in_cascade text;
BEGIN
  -- Protection anti-boucle : si on est déjà dans une cascade, ne rien faire
  v_in_cascade := current_setting('app.in_production_cascade', true);
  IF v_in_cascade = 'true' THEN
    RETURN NEW;
  END IF;

  -- Activer le flag anti-boucle
  PERFORM set_config('app.in_production_cascade', 'true', true);

  -- ========================================
  -- RÈGLE 1 : COCHAGE (escalier montant)
  -- ========================================
  
  -- Si Planifié est coché → cocher Montage, Tournage, Script
  IF NEW.date_scheduling IS NOT NULL AND OLD.date_scheduling IS NULL THEN
    NEW.date_editing := COALESCE(NEW.date_editing, NEW.date_scheduling);
    NEW.date_shooting := COALESCE(NEW.date_shooting, NEW.date_scheduling);
    NEW.date_script := COALESCE(NEW.date_script, NEW.date_scheduling);
  END IF;

  -- Si Montage est coché → cocher Tournage, Script
  IF NEW.date_editing IS NOT NULL AND OLD.date_editing IS NULL THEN
    NEW.date_shooting := COALESCE(NEW.date_shooting, NEW.date_editing);
    NEW.date_script := COALESCE(NEW.date_script, NEW.date_editing);
  END IF;

  -- Si Tournage est coché → cocher Script
  IF NEW.date_shooting IS NOT NULL AND OLD.date_shooting IS NULL THEN
    NEW.date_script := COALESCE(NEW.date_script, NEW.date_shooting);
  END IF;

  -- ========================================
  -- RÈGLE 2 : DÉCOCHAGE (cascade descendante)
  -- ========================================
  
  -- Si Script est décoché → décocher Tournage, Montage, Planifié
  IF OLD.date_script IS NOT NULL AND NEW.date_script IS NULL THEN
    NEW.date_shooting := NULL;
    NEW.date_editing := NULL;
    NEW.date_scheduling := NULL;
  END IF;

  -- Si Tournage est décoché → décocher Montage, Planifié
  IF OLD.date_shooting IS NOT NULL AND NEW.date_shooting IS NULL THEN
    NEW.date_editing := NULL;
    NEW.date_scheduling := NULL;
  END IF;

  -- Si Montage est décoché → décocher Planifié
  IF OLD.date_editing IS NOT NULL AND NEW.date_editing IS NULL THEN
    NEW.date_scheduling := NULL;
  END IF;

  -- Désactiver le flag
  PERFORM set_config('app.in_production_cascade', 'false', true);

  RETURN NEW;
END;
$$;

-- Créer LE trigger unique BEFORE UPDATE
CREATE TRIGGER trigger_production_bidirectional_logic
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION handle_production_steps_logic();

COMMENT ON FUNCTION handle_production_steps_logic IS
'Gère la logique bidirectionnelle des étapes de production : cochage en escalier montant, décochage en cascade descendante. Ordre : Script → Tournage → Montage → Planifié';
