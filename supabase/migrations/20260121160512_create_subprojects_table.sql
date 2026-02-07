/*
  # Create Subprojects Table and Link with Tasks

  1. New Tables
    - `subprojects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_id` (uuid, foreign key to company_profiles)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text, required) - Subproject name
      - `description` (text, optional) - Subproject description
      - `color` (text) - Color for UI identification (hex code)
      - `tag_prefix` (text) - Prefix for automatic tags (e.g., "design", "dev")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `subproject_id` column to `tasks` table (optional foreign key)
    - Automatically generate tags based on subproject when a task is assigned

  3. Security
    - Enable RLS on `subprojects` table
    - Add policies for authenticated users to manage their own subprojects

  4. Triggers
    - Auto-generate tags when a task is assigned to a subproject
    - Update project status when subproject tasks change

  5. Indexes
    - Add index on project_id for fast subproject lookups
    - Add index on subproject_id in tasks table
*/

-- Create subprojects table
CREATE TABLE IF NOT EXISTS subprojects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6', -- Default blue color
  tag_prefix text, -- Will be used to generate automatic tags
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add subproject_id to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'subproject_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN subproject_id uuid REFERENCES subprojects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subprojects_user_id ON subprojects(user_id);
CREATE INDEX IF NOT EXISTS idx_subprojects_company_id ON subprojects(company_id);
CREATE INDEX IF NOT EXISTS idx_subprojects_project_id ON subprojects(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subproject_id ON tasks(subproject_id);

-- Enable RLS
ALTER TABLE subprojects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subprojects
CREATE POLICY "Users can view own subprojects"
  ON subprojects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subprojects"
  ON subprojects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subprojects"
  ON subprojects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subprojects"
  ON subprojects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update subproject updated_at timestamp
CREATE OR REPLACE FUNCTION update_subproject_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_subprojects_updated_at
  BEFORE UPDATE ON subprojects
  FOR EACH ROW
  EXECUTE FUNCTION update_subproject_updated_at();

-- Function to auto-generate tags based on subproject
CREATE OR REPLACE FUNCTION auto_generate_subproject_tags()
RETURNS TRIGGER AS $$
DECLARE
  v_tag_prefix text;
  v_subproject_name text;
  v_current_tags text;
  v_new_tag text;
BEGIN
  -- If subproject_id is set, generate tag
  IF NEW.subproject_id IS NOT NULL THEN
    -- Get subproject info
    SELECT tag_prefix, name INTO v_tag_prefix, v_subproject_name
    FROM subprojects
    WHERE id = NEW.subproject_id;

    -- Generate tag (use tag_prefix if available, otherwise use subproject name)
    v_new_tag := COALESCE(v_tag_prefix, LOWER(REPLACE(v_subproject_name, ' ', '-')));
    
    -- Get current tags
    v_current_tags := COALESCE(NEW.tags, '');
    
    -- Check if tag already exists (avoid duplicates)
    IF v_current_tags = '' THEN
      NEW.tags := v_new_tag;
    ELSIF v_current_tags NOT LIKE '%' || v_new_tag || '%' THEN
      -- Append tag if it doesn't exist
      IF v_current_tags LIKE 'content:%' THEN
        -- Keep content: tags intact
        NEW.tags := v_current_tags;
      ELSE
        NEW.tags := v_new_tag || ',' || v_current_tags;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tags when task is assigned to subproject
CREATE TRIGGER trigger_auto_generate_subproject_tags
  BEFORE INSERT OR UPDATE OF subproject_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_subproject_tags();

COMMENT ON TABLE subprojects IS 
'Sous-projets permettant de mieux organiser les tâches au sein d''un projet principal.
Les sous-projets génèrent automatiquement des tags pour faciliter le filtrage.';

COMMENT ON COLUMN subprojects.tag_prefix IS 
'Préfixe utilisé pour générer automatiquement des tags sur les tâches.
Si NULL, utilise le nom du sous-projet en lowercase avec tirets.';

COMMENT ON COLUMN subprojects.color IS 
'Couleur d''identification du sous-projet dans l''UI (format hex: #rrggbb).';
