/*
  # Add formation documents table (fixed)

  ## Description
  This migration creates a table to store training/formation documents
  that can be attached to services of type 'formation'.
  These documents are optional and serve as reusable resources (program, materials, etc.).

  ## Changes
  1. Create formation_documents table
     - Links to services table
     - Stores file path, document type, and metadata
     - Optional documents for formations
  
  2. Security
     - Enable RLS
     - Users can only access documents from their own services

  ## New Table
  - `formation_documents`
    - id (uuid, primary key)
    - service_id (uuid, foreign key to services)
    - document_type (text) - 'program', 'materials', 'other'
    - file_path (text) - URL to the document
    - file_name (text) - Original file name
    - uploaded_at (timestamptz)
    - created_at (timestamptz)

  ## Safety
  - Uses IF NOT EXISTS to prevent errors
  - RLS enabled by default
  - Cascade deletion when service is deleted
*/

-- Create formation_documents table
CREATE TABLE IF NOT EXISTS formation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('program', 'materials', 'other')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE formation_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view formation documents from their own services
CREATE POLICY "Users can view own formation documents"
  ON formation_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = formation_documents.service_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Users can insert formation documents for their own services
CREATE POLICY "Users can add formation documents to own services"
  ON formation_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = formation_documents.service_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Users can delete formation documents from their own services
CREATE POLICY "Users can delete own formation documents"
  ON formation_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = formation_documents.service_id
      AND s.user_id = auth.uid()
    )
  );

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_formation_documents_service_id
ON formation_documents(service_id);