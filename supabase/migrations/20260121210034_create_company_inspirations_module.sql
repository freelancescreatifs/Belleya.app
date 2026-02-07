/*
  # Create Company Inspirations Module for Beauty Salon

  1. New Tables
    - `company_inspirations`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references company_profiles)
      - `type` (text, enum: social_media, salon, service)
      - `title` (text, optional)
      - `description` (text, optional notes)
      - `image_url` (text, photo URL)
      - `service_type` (text, optional for service type inspirations)
      - `client_id` (uuid, optional association to client)
      - `created_at` (timestamptz)

  2. Storage
    - Create bucket for company inspiration images

  3. Security
    - Enable RLS on company_inspirations table
    - Add policies for authenticated users to manage their company's inspirations
    - Add storage policies for image upload/download
*/

-- Create company_inspirations table
CREATE TABLE IF NOT EXISTS company_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('social_media', 'salon', 'service')),
  title text,
  description text,
  image_url text NOT NULL,
  service_type text,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_inspirations_company_id ON company_inspirations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_inspirations_type ON company_inspirations(type);
CREATE INDEX IF NOT EXISTS idx_company_inspirations_client_id ON company_inspirations(client_id);
CREATE INDEX IF NOT EXISTS idx_company_inspirations_service_type ON company_inspirations(service_type);

-- Enable RLS
ALTER TABLE company_inspirations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_inspirations
CREATE POLICY "Users can view their company inspirations"
  ON company_inspirations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert inspirations for their company"
  ON company_inspirations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company inspirations"
  ON company_inspirations FOR UPDATE
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

CREATE POLICY "Users can delete their company inspirations"
  ON company_inspirations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for company inspiration images
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-inspirations', 'company-inspirations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company inspiration images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload company inspiration images'
  ) THEN
    CREATE POLICY "Authenticated users can upload company inspiration images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'company-inspirations');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view company inspiration images'
  ) THEN
    CREATE POLICY "Public can view company inspiration images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'company-inspirations');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their company inspiration images'
  ) THEN
    CREATE POLICY "Users can delete their company inspiration images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'company-inspirations');
  END IF;
END $$;
