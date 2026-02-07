/*
  # Ajout company_id pour isolation multi-entreprise

  1. Modifications
    - Ajouter `company_id` à la table `tasks`
    - Ajouter `company_id` à la table `content_calendar`
    - Migrer les données existantes pour associer le company_id depuis user_profiles
    - Mettre à jour les policies RLS pour filtrer par company_id au lieu de user_id

  2. Sécurité
    - Les utilisateurs d'une même entreprise peuvent voir et modifier les données de l'entreprise
    - L'isolation est faite par company_id, pas par user_id
    - Les policies vérifient que l'utilisateur appartient à l'entreprise via user_profiles

  3. Objectif
    - Permettre le travail collaboratif au sein d'une même entreprise
    - Isoler complètement les données entre entreprises différentes
*/

-- Add company_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE;

-- Add company_id to content_calendar table
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE;

-- Migrate existing tasks data
UPDATE tasks t
SET company_id = up.company_id
FROM user_profiles up
WHERE t.user_id = up.user_id
AND t.company_id IS NULL
AND up.company_id IS NOT NULL;

-- Migrate existing content_calendar data
UPDATE content_calendar cc
SET company_id = up.company_id
FROM user_profiles up
WHERE cc.user_id = up.user_id
AND cc.company_id IS NULL
AND up.company_id IS NOT NULL;

-- Drop old policies for tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create new company-based policies for tasks
CREATE POLICY "Users can view company tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert company tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company tasks"
  ON tasks FOR UPDATE
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

CREATE POLICY "Users can delete company tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Drop old policies for content_calendar
DROP POLICY IF EXISTS "Users can view own content calendar" ON content_calendar;
DROP POLICY IF EXISTS "Users can insert own content calendar" ON content_calendar;
DROP POLICY IF EXISTS "Users can update own content calendar" ON content_calendar;
DROP POLICY IF EXISTS "Users can delete own content calendar" ON content_calendar;

-- Create new company-based policies for content_calendar
CREATE POLICY "Users can view company content"
  ON content_calendar FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert company content"
  ON content_calendar FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company content"
  ON content_calendar FOR UPDATE
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

CREATE POLICY "Users can delete company content"
  ON content_calendar FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_company_id ON content_calendar(company_id);
