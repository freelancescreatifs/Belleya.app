/*
  # Add Client Media Gallery System

  1. New Tables
    - `client_inspirations`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `url` (text, media URL)
      - `uploaded_by` (uuid, references user_profiles)
      - `created_at` (timestamptz)
      - `company_id` (uuid, references company_profiles)

    - `client_results_photos`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `url` (text, media URL)
      - `uploaded_by` (uuid, references user_profiles)
      - `created_at` (timestamptz)
      - `company_id` (uuid, references company_profiles)

  2. Storage
    - Create bucket for client media

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their company's client media
    - Add storage policies for media upload/download
*/

-- Create client_inspirations table
CREATE TABLE IF NOT EXISTS client_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create client_results_photos table
CREATE TABLE IF NOT EXISTS client_results_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_inspirations_client_id ON client_inspirations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_inspirations_company_id ON client_inspirations(company_id);
CREATE INDEX IF NOT EXISTS idx_client_results_photos_client_id ON client_results_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_client_results_photos_company_id ON client_results_photos(company_id);

-- Enable RLS
ALTER TABLE client_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_results_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_inspirations
CREATE POLICY "Users can view their company's client inspirations"
  ON client_inspirations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's client inspirations"
  ON client_inspirations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's client inspirations"
  ON client_inspirations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for client_results_photos
CREATE POLICY "Users can view their company's client results photos"
  ON client_results_photos FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's client results photos"
  ON client_results_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's client results photos"
  ON client_results_photos FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create storage bucket for client media
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-media', 'client-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-media bucket
CREATE POLICY "Authenticated users can upload client media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update their client media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete their client media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Public can view client media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-media');