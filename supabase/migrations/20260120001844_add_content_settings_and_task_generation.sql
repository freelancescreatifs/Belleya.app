/*
  # Paramètres de contenu et génération de tâches

  1. Nouvelles Tables
    - `content_settings`
      - Paramètres d'affichage des vues de contenu par entreprise
      - `id` (uuid, primary key)
      - `company_id` (uuid, unique, foreign key)
      - `show_editorial_calendar` (boolean) - afficher le calendrier éditorial
      - `show_production_calendar` (boolean) - afficher le calendrier de production
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `production_tasks`
      - Tâches générées à partir des étapes de production
      - `id` (uuid, primary key)
      - `content_id` (uuid, foreign key vers content_calendar)
      - `task_id` (uuid, foreign key vers tasks)
      - `production_step` (text) - script, shooting, editing, subtitles, validation, scheduling
      - `created_at` (timestamptz)

  2. Modifications
    - Ajouter `task_time` aux étapes de production pour permettre d'ajouter une heure aux tâches

  3. Sécurité
    - RLS restrictif sur toutes les tables
    - Filtrage par company_id

  4. Objectif
    - Permettre la configuration des vues par entreprise
    - Lier automatiquement les étapes de production aux tâches
    - Traçabilité entre contenu et tâches de production
*/

-- Create content_settings table
CREATE TABLE IF NOT EXISTS content_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  show_editorial_calendar boolean DEFAULT true,
  show_production_calendar boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company content settings"
  ON content_settings FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert company content settings"
  ON content_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company content settings"
  ON content_settings FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create production_tasks table to link content to tasks
CREATE TABLE IF NOT EXISTS production_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_calendar(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  production_step text NOT NULL CHECK (production_step IN ('script', 'shooting', 'editing', 'subtitles', 'validation', 'scheduling')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, production_step)
);

ALTER TABLE production_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company production tasks"
  ON production_tasks FOR SELECT
  TO authenticated
  USING (
    content_id IN (
      SELECT id FROM content_calendar WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert company production tasks"
  ON production_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    content_id IN (
      SELECT id FROM content_calendar WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete company production tasks"
  ON production_tasks FOR DELETE
  TO authenticated
  USING (
    content_id IN (
      SELECT id FROM content_calendar WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Add time fields for production steps (for task scheduling)
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS date_script_time text DEFAULT '09:00';
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS date_shooting_time text DEFAULT '09:00';
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS date_editing_time text DEFAULT '09:00';
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS date_subtitles_time text DEFAULT '09:00';
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS date_validation_time text DEFAULT '09:00';
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS date_scheduling_time text DEFAULT '09:00';

-- Add field to track if content came from AI generation
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS generated_by_ai boolean DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_settings_company_id ON content_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_content_id ON production_tasks(content_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_task_id ON production_tasks(task_id);
