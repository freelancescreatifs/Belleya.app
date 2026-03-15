/*
  # Create Client Documents System

  ## Summary
  This migration creates a full document lifecycle system for providers to send
  PDF/image files to their clients, and for clients to download and return filled versions.

  ## New Tables

  ### client_documents
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK to clients.id) - the client record in the provider's CRM
  - `company_id` (uuid, FK to company_profiles.id) - the provider's company
  - `client_user_id` (uuid, nullable) - the belaya_user_id of the client (for client-side access)
  - `file_url` (text) - URL of the original file uploaded by provider
  - `file_name` (text) - original file name
  - `file_type` (text) - mime type
  - `title` (text) - human-readable title
  - `notes` (text, nullable) - optional notes from provider
  - `status` (text) - 'pending' | 'viewed' | 'returned'
  - `returned_file_url` (text, nullable) - URL of the file returned by client
  - `returned_file_name` (text, nullable) - name of the returned file
  - `returned_at` (timestamptz, nullable) - when client returned the document
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on client_documents
  - Providers can SELECT/INSERT/DELETE their own documents (matched by company_id)
  - Providers can UPDATE status fields
  - Clients can SELECT documents where client_user_id = auth.uid()
  - Clients can UPDATE to set returned_file_url and status = 'returned'
  - Clients can UPDATE status to 'viewed'

  ## Storage
  - Creates client-documents bucket (public: false, file size limit: 20MB)
  - Storage RLS: providers upload to company_id/client_id/ paths
  - Storage RLS: clients read from paths linked to their documents
*/

-- Create the client_documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  client_user_id uuid,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'returned')),
  returned_file_url text,
  returned_file_name text,
  returned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by provider
CREATE INDEX IF NOT EXISTS idx_client_documents_company_id ON client_documents(company_id);

-- Index for fast lookups by client
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);

-- Index for client-side access
CREATE INDEX IF NOT EXISTS idx_client_documents_client_user_id ON client_documents(client_user_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);

-- Enable Row Level Security
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Provider: SELECT their own documents (via company_id matched to their company profile)
CREATE POLICY "Providers can view their client documents"
  ON client_documents FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Provider: INSERT documents for their clients
CREATE POLICY "Providers can insert client documents"
  ON client_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Provider: UPDATE their documents (e.g., change title, notes)
CREATE POLICY "Providers can update their client documents"
  ON client_documents FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Provider: DELETE their documents
CREATE POLICY "Providers can delete their client documents"
  ON client_documents FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Client: SELECT documents sent to them
CREATE POLICY "Clients can view their own documents"
  ON client_documents FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

-- Client: UPDATE documents they received (to mark as viewed or return)
CREATE POLICY "Clients can update their own documents"
  ON client_documents FOR UPDATE
  TO authenticated
  USING (client_user_id = auth.uid())
  WITH CHECK (client_user_id = auth.uid());

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_client_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_client_documents_updated_at
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_client_documents_updated_at();

-- Create the client-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: providers can upload files to their company folder
CREATE POLICY "Providers can upload client documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Storage RLS: providers can read files from their company folder
CREATE POLICY "Providers can read their client documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Storage RLS: providers can delete files from their company folder
CREATE POLICY "Providers can delete their client documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Storage RLS: clients can read files sent to them
CREATE POLICY "Clients can read documents sent to them"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM client_documents
      WHERE client_user_id = auth.uid()
      AND (file_url LIKE '%' || name || '%' OR returned_file_url LIKE '%' || name || '%')
    )
  );

-- Storage RLS: clients can upload returned documents
CREATE POLICY "Clients can upload returned documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[2] = 'returned'
    AND EXISTS (
      SELECT 1 FROM client_documents
      WHERE client_user_id = auth.uid()
      AND company_id::text = (storage.foldername(name))[1]
    )
  );
