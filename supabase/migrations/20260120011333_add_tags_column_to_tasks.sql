/*
  # Ajouter la colonne tags à la table tasks

  1. Modifications
    - Ajouter la colonne `tags` (text) pour catégoriser les tâches
    - Permet de marquer les tâches générées automatiquement avec "Réseaux sociaux"

  2. Objectif
    - Permettre le filtrage et l'organisation des tâches par tags
    - Identifier facilement les tâches liées à la production de contenu
*/

-- Ajouter la colonne tags si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags text;
  END IF;
END $$;

-- Créer un index pour les recherches par tags
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks(tags) WHERE tags IS NOT NULL;
