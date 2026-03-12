/*
  # Create training document templates system

  1. New Tables
    - `training_document_templates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, FK -> company_profiles.id)
      - `label` (text) - Display name of the document (e.g. "Contrat signe")
      - `stage` (text) - 'before', 'during', or 'after'
      - `is_required` (boolean, default false) - Whether document is mandatory
      - `position` (integer, default 0) - Sort order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `training_document_templates`
    - Authenticated users can CRUD their own company templates

  3. Changes
    - Relax document_type constraint on student_documents to allow 'custom' type
    - Add template_id column to student_documents to link to template

  4. Seed default templates
    - Function to auto-seed default templates when first accessed
    - Default templates match existing hardcoded list, all set to optional

  5. Notes
    - Each provider independently manages their own document template list
    - Templates are per company, not global
    - "is_required" defaults to false (optional by default)
    - Providers can add new custom templates and toggle required status
*/

-- Create templates table
CREATE TABLE IF NOT EXISTS training_document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('before', 'during', 'after')),
  is_required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE training_document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company templates"
  ON training_document_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT cp.id FROM company_profiles cp WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company templates"
  ON training_document_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT cp.id FROM company_profiles cp WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company templates"
  ON training_document_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT cp.id FROM company_profiles cp WHERE cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT cp.id FROM company_profiles cp WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company templates"
  ON training_document_templates FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT cp.id FROM company_profiles cp WHERE cp.user_id = auth.uid()
    )
  );

-- Add template_id to student_documents (nullable for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_documents' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE student_documents ADD COLUMN template_id uuid REFERENCES training_document_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Allow 'custom' as a document_type value (expand the existing constraint)
ALTER TABLE student_documents DROP CONSTRAINT IF EXISTS student_documents_document_type_check;
ALTER TABLE student_documents ADD CONSTRAINT student_documents_document_type_check
  CHECK (document_type IN (
    'contract', 'signed_quote', 'training_program_doc', 'signed_rules',
    'attendance_sheets', 'training_materials', 'skills_assessment', 'satisfaction_survey',
    'completion_certificate', 'invoice', 'other', 'custom'
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_doc_templates_company
  ON training_document_templates(company_id);

CREATE INDEX IF NOT EXISTS idx_student_documents_template_id
  ON student_documents(template_id);

-- Create function to seed default templates for a company
CREATE OR REPLACE FUNCTION seed_default_training_templates(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM training_document_templates WHERE company_id = p_company_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO training_document_templates (company_id, label, stage, is_required, position) VALUES
    (p_company_id, 'Contrat / Convention de formation', 'before', false, 1),
    (p_company_id, 'Devis signe', 'before', false, 2),
    (p_company_id, 'Programme de formation', 'before', false, 3),
    (p_company_id, 'Reglement interieur signe', 'before', false, 4),
    (p_company_id, 'Feuilles d''emargement', 'during', false, 1),
    (p_company_id, 'Supports de formation', 'during', false, 2),
    (p_company_id, 'Evaluation des acquis', 'during', false, 3),
    (p_company_id, 'Questionnaire de satisfaction', 'during', false, 4),
    (p_company_id, 'Attestation de fin de formation', 'after', false, 1),
    (p_company_id, 'Facture', 'after', false, 2);
END;
$$;
