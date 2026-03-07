/*
  # Create Target Audiences Table

  1. New Tables
    - `target_audiences` - Profils de cible audience pré-définis (comme les piliers éditoriaux)
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `audience_name` (text, unique per company)
      - `description` (text)
      - `keywords` (text[], array de mots-clés)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `target_audiences` table
    - Add policy for company users to read/modify their audiences
    - Add policy for admins to manage all audiences
*/

CREATE TABLE IF NOT EXISTS target_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  audience_name text NOT NULL,
  description text,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(company_id, audience_name)
);

ALTER TABLE target_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own company's audiences"
  ON target_audiences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = target_audiences.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create audiences for their company"
  ON target_audiences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company's audiences"
  ON target_audiences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = target_audiences.company_id
      AND company_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = target_audiences.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company's audiences"
  ON target_audiences FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = target_audiences.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all audiences"
  ON target_audiences FOR ALL
  TO authenticated
  USING (
    is_admin()
  );

CREATE INDEX idx_target_audiences_company_id ON target_audiences(company_id);
