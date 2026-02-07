/*
  # Create Service Photos Storage Bucket

  1. New Storage Bucket
    - `service-photos` bucket for storing service images
    - Public access for reading (so clients can view service photos)
    - Authenticated users can upload their own service photos
    
  2. Security
    - RLS policies for secure file access
    - Users can only upload to their own folder
    - Users can only delete their own files
    - Public can read all files (for displaying services to clients)
*/

-- Create the storage bucket for service photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload service photos to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own service photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own service photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all service photos
CREATE POLICY "Public can view service photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-photos');
