/*
  # Create client profile photos storage bucket

  1. New Storage Bucket
    - Create `client-photos` bucket for storing client profile photos
    - Set bucket to public for easy access to profile photos

  2. Storage Policies
    - Allow authenticated users to upload their own photos
    - Allow public read access to photos
    - Allow users to update/delete their own photos
*/

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-photos',
  'client-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-photos' AND
  (storage.foldername(name))[1] = 'client-profiles' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Allow public read access to all client photos
CREATE POLICY "Public read access to client photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-photos');

-- Policy: Allow users to update their own photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'client-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Allow users to delete their own photos
CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);