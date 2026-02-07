/*
  # Synchronisation automatique entre les tâches et le contenu

  1. Objectif
    - Mettre à jour automatiquement le statut du contenu quand une tâche de production est terminée
    - Calculer la progression du contenu (X/Y tâches terminées)
    - Faire avancer automatiquement l'étape de production du contenu

  2. Modifications
    - Créer une fonction pour calculer la progression d'un contenu
    - Créer un trigger sur les tâches pour synchroniser avec le contenu
    - Ajouter une colonne production_step à la table tasks

  3. Logique
    - Quand une tâche de production est marquée comme terminée
    - Le contenu associé passe automatiquement à l'étape de production suivante
    - La progression est mise à jour (tâches terminées / total tâches)
*/

-- Ajouter la colonne production_step si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'production_step'
  ) THEN
    ALTER TABLE tasks ADD COLUMN production_step text CHECK (production_step IN ('script', 'shooting', 'editing', 'subtitles', 'validation', 'scheduling'));
  END IF;
END $$;

-- Fonction pour obtenir le statut du contenu basé sur les tâches terminées
CREATE OR REPLACE FUNCTION get_content_status_from_completed_steps(content_id_param uuid)
RETURNS text AS $$
DECLARE
  completed_steps text[];
  content_type_var text;
  has_script boolean;
  has_shooting boolean;
  has_editing boolean;
BEGIN
  -- Récupérer le type de contenu
  SELECT content_type INTO content_type_var
  FROM content_calendar
  WHERE id = content_id_param;

  -- Récupérer les étapes terminées via production_tasks
  SELECT array_agg(DISTINCT pt.production_step)
  INTO completed_steps
  FROM production_tasks pt
  JOIN tasks t ON t.id = pt.task_id
  WHERE pt.content_id = content_id_param
    AND t.completed = true;

  -- Si aucune tâche terminée, retourner le statut actuel
  IF completed_steps IS NULL OR array_length(completed_steps, 1) IS NULL THEN
    RETURN 'to_produce';
  END IF;

  -- Vérifier quelles étapes sont terminées
  has_script := 'script' = ANY(completed_steps);
  has_shooting := 'shooting' = ANY(completed_steps);
  has_editing := 'editing' = ANY(completed_steps);

  -- Logique pour déterminer le statut
  -- Pour les reels et videos qui nécessitent tournage et montage
  IF content_type_var IN ('reel', 'video') THEN
    IF has_editing THEN
      RETURN 'scheduled';
    ELSIF has_shooting THEN
      RETURN 'to_edit';
    ELSIF has_script THEN
      RETURN 'to_shoot';
    ELSE
      RETURN 'to_produce';
    END IF;
  END IF;

  -- Pour les carrousels qui nécessitent du montage mais pas de tournage
  IF content_type_var = 'carrousel' THEN
    IF has_editing THEN
      RETURN 'scheduled';
    ELSIF has_script THEN
      RETURN 'to_edit';
    ELSE
      RETURN 'to_produce';
    END IF;
  END IF;

  -- Pour les posts et stories simples
  IF content_type_var IN ('post', 'story', 'live') THEN
    IF has_script THEN
      RETURN 'scheduled';
    ELSE
      RETURN 'to_produce';
    END IF;
  END IF;

  RETURN 'to_produce';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction trigger pour synchroniser les tâches avec le contenu
CREATE OR REPLACE FUNCTION sync_task_completion_to_content()
RETURNS TRIGGER AS $$
DECLARE
  content_id_var uuid;
  new_status text;
BEGIN
  -- Vérifier si la tâche a un lien avec un contenu via production_tasks
  SELECT pt.content_id INTO content_id_var
  FROM production_tasks pt
  WHERE pt.task_id = NEW.id
  LIMIT 1;

  -- Si la tâche est liée à un contenu
  IF content_id_var IS NOT NULL THEN
    -- Calculer le nouveau statut basé sur les étapes terminées
    new_status := get_content_status_from_completed_steps(content_id_var);

    -- Mettre à jour le statut du contenu
    UPDATE content_calendar
    SET
      status = new_status,
      updated_at = now()
    WHERE id = content_id_var;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_sync_task_to_content ON tasks;

-- Créer le trigger qui s'exécute après chaque mise à jour de tâche
CREATE TRIGGER trigger_sync_task_to_content
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.completed IS DISTINCT FROM NEW.completed)
  EXECUTE FUNCTION sync_task_completion_to_content();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_production_step ON tasks(production_step) WHERE production_step IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed) WHERE completed = true;
