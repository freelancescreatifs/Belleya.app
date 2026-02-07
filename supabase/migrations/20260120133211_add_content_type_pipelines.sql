/*
  # Ajout des pipelines de production par type de contenu

  1. Modifications à production_defaults
    - Ajout de colonnes JSONB pour stocker les pipelines par type de contenu
    - Chaque pipeline définit les étapes et leurs délais (en jours après production_start_date)
    - Support pour différents workflows selon le type (reel, carrousel, post, etc.)

  2. Structure des pipelines
    Chaque pipeline est un objet JSON avec :
    - steps: array d'objets { name, label, delayDays }
    - name: identifiant de l'étape (script, shooting, editing, scheduling)
    - label: label affiché à l'utilisateur
    - delayDays: nombre de jours après production_start_date

  3. Pipelines par défaut
    - reel: script (J+0) → shooting (J+1) → editing (J+2) → scheduling (J+3)
    - carrousel: script (J+0) → creation (J+1) → scheduling (J+2)
    - post: script (J+0) → creation (J+1) → scheduling (J+2)
    - story: creation (J+0) → scheduling (J+1)
    - video: script (J+0) → shooting (J+1) → editing (J+2) → scheduling (J+3)
    - live: preparation (J+0) → event (J+1)

  4. Notes
    - Les anciens champs (script_delay, shooting_delay, etc.) sont conservés pour compatibilité
    - La nouvelle logique utilise les pipelines JSONB
    - Les utilisateurs peuvent personnaliser chaque pipeline
*/

-- Ajouter les colonnes pour les pipelines par type de contenu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_defaults' AND column_name = 'pipeline_reel'
  ) THEN
    ALTER TABLE production_defaults ADD COLUMN pipeline_reel jsonb DEFAULT '[
      {"name": "script", "label": "Écriture", "delayDays": 0},
      {"name": "shooting", "label": "Tournage", "delayDays": 1},
      {"name": "editing", "label": "Montage", "delayDays": 2},
      {"name": "scheduling", "label": "Programmation", "delayDays": 3}
    ]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_defaults' AND column_name = 'pipeline_carrousel'
  ) THEN
    ALTER TABLE production_defaults ADD COLUMN pipeline_carrousel jsonb DEFAULT '[
      {"name": "script", "label": "Écriture", "delayDays": 0},
      {"name": "shooting", "label": "Création graphique", "delayDays": 1},
      {"name": "scheduling", "label": "Programmation", "delayDays": 2}
    ]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_defaults' AND column_name = 'pipeline_post'
  ) THEN
    ALTER TABLE production_defaults ADD COLUMN pipeline_post jsonb DEFAULT '[
      {"name": "script", "label": "Écriture", "delayDays": 0},
      {"name": "shooting", "label": "Création visuelle", "delayDays": 1},
      {"name": "scheduling", "label": "Programmation", "delayDays": 2}
    ]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_defaults' AND column_name = 'pipeline_story'
  ) THEN
    ALTER TABLE production_defaults ADD COLUMN pipeline_story jsonb DEFAULT '[
      {"name": "shooting", "label": "Création", "delayDays": 0},
      {"name": "scheduling", "label": "Programmation", "delayDays": 1}
    ]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_defaults' AND column_name = 'pipeline_video'
  ) THEN
    ALTER TABLE production_defaults ADD COLUMN pipeline_video jsonb DEFAULT '[
      {"name": "script", "label": "Écriture", "delayDays": 0},
      {"name": "shooting", "label": "Tournage", "delayDays": 1},
      {"name": "editing", "label": "Montage", "delayDays": 2},
      {"name": "scheduling", "label": "Programmation", "delayDays": 3}
    ]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_defaults' AND column_name = 'pipeline_live'
  ) THEN
    ALTER TABLE production_defaults ADD COLUMN pipeline_live jsonb DEFAULT '[
      {"name": "script", "label": "Préparation", "delayDays": 0},
      {"name": "shooting", "label": "Live", "delayDays": 1}
    ]'::jsonb;
  END IF;
END $$;

-- Mettre à jour les enregistrements existants pour avoir les pipelines par défaut
UPDATE production_defaults
SET
  pipeline_reel = '[
    {"name": "script", "label": "Écriture", "delayDays": 0},
    {"name": "shooting", "label": "Tournage", "delayDays": 1},
    {"name": "editing", "label": "Montage", "delayDays": 2},
    {"name": "scheduling", "label": "Programmation", "delayDays": 3}
  ]'::jsonb,
  pipeline_carrousel = '[
    {"name": "script", "label": "Écriture", "delayDays": 0},
    {"name": "shooting", "label": "Création graphique", "delayDays": 1},
    {"name": "scheduling", "label": "Programmation", "delayDays": 2}
  ]'::jsonb,
  pipeline_post = '[
    {"name": "script", "label": "Écriture", "delayDays": 0},
    {"name": "shooting", "label": "Création visuelle", "delayDays": 1},
    {"name": "scheduling", "label": "Programmation", "delayDays": 2}
  ]'::jsonb,
  pipeline_story = '[
    {"name": "shooting", "label": "Création", "delayDays": 0},
    {"name": "scheduling", "label": "Programmation", "delayDays": 1}
  ]'::jsonb,
  pipeline_video = '[
    {"name": "script", "label": "Écriture", "delayDays": 0},
    {"name": "shooting", "label": "Tournage", "delayDays": 1},
    {"name": "editing", "label": "Montage", "delayDays": 2},
    {"name": "scheduling", "label": "Programmation", "delayDays": 3}
  ]'::jsonb,
  pipeline_live = '[
    {"name": "script", "label": "Préparation", "delayDays": 0},
    {"name": "shooting", "label": "Live", "delayDays": 1}
  ]'::jsonb,
  updated_at = now()
WHERE
  pipeline_reel IS NULL OR
  pipeline_carrousel IS NULL OR
  pipeline_post IS NULL OR
  pipeline_story IS NULL OR
  pipeline_video IS NULL OR
  pipeline_live IS NULL;
