/*
  # Create Production Defaults Configuration

  1. New Table: production_defaults
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `script_delay` (integer) - Days after start for script (default 0)
    - `shooting_delay` (integer) - Days after start for shooting (default 1)
    - `editing_delay` (integer) - Days after start for editing (default 2)
    - `subtitles_delay` (integer) - Days after start for subtitles (default 3)
    - `validation_delay` (integer) - Days after start for validation (default 4)
    - `scheduling_delay` (integer) - Days after start for scheduling (default 5)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Users can only read/update their own defaults
    - Auto-create defaults on user profile creation

  3. Purpose
    - Store user-specific default delays for auto-planning
    - Allow customization of production timeline
*/

-- Create table
CREATE TABLE IF NOT EXISTS production_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_delay integer DEFAULT 0,
  shooting_delay integer DEFAULT 1,
  editing_delay integer DEFAULT 2,
  subtitles_delay integer DEFAULT 3,
  validation_delay integer DEFAULT 4,
  scheduling_delay integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE production_defaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own production defaults"
  ON production_defaults FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own production defaults"
  ON production_defaults FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own production defaults"
  ON production_defaults FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own production defaults"
  ON production_defaults FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_production_defaults_user_id ON production_defaults(user_id);

-- Function to create default production_defaults for new users
CREATE OR REPLACE FUNCTION create_production_defaults_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.production_defaults (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create production defaults
DROP TRIGGER IF EXISTS on_auth_user_created_production_defaults ON auth.users;
CREATE TRIGGER on_auth_user_created_production_defaults
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_production_defaults_for_new_user();
