/*
  # Correction des company_id manquants dans les tâches

  1. Problème identifié
    - Les tâches (tasks) existantes n'ont pas de company_id défini
    - Les RLS policies requièrent un company_id pour autoriser les mises à jour
    - Cela empêche de cocher/décocher les étapes de production

  2. Solution
    - Remplir le company_id manquant pour toutes les tâches existantes
    - Utiliser le company_id du user_profile correspondant au user_id de la tâche
    - S'assurer que les nouvelles tâches ont toujours un company_id

  3. Sécurité
    - Maintien des RLS policies existantes
    - Les utilisateurs ne peuvent modifier que les tâches de leur entreprise
*/

-- Mettre à jour toutes les tâches sans company_id
UPDATE tasks
SET company_id = (
  SELECT company_id
  FROM user_profiles
  WHERE user_profiles.user_id = tasks.user_id
  LIMIT 1
)
WHERE company_id IS NULL
  AND user_id IS NOT NULL;

-- S'assurer que la colonne company_id est NOT NULL pour les nouvelles entrées
-- (seulement si toutes les lignes existantes ont été mises à jour)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tasks WHERE company_id IS NULL
  ) THEN
    -- Rendre company_id NOT NULL si toutes les tâches ont un company_id
    ALTER TABLE tasks ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;

-- Créer un trigger pour auto-remplir company_id lors de la création de tâches
CREATE OR REPLACE FUNCTION auto_set_task_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si company_id n'est pas défini, le récupérer depuis user_profiles
  IF NEW.company_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.company_id := (
      SELECT company_id
      FROM user_profiles
      WHERE user_id = NEW.user_id
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS trigger_auto_set_task_company_id ON tasks;
CREATE TRIGGER trigger_auto_set_task_company_id
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_task_company_id();