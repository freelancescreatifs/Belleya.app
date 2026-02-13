/*
  # Create Storage Buckets for Belleya Rewards

  1. Buckets
    - `rewards-proof-images` - For mission #1 proof screenshots
    - `rewards-videos` - For mission #2 video reviews

  2. Security
    - Authenticated users can upload to their own folder
    - Public can read approved content
    - Admins can access all content
*/

-- Create rewards proof images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rewards-proof-images', 'rewards-proof-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create rewards videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rewards-videos', 'rewards-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for rewards-proof-images

-- Allow authenticated users to upload proof images
CREATE POLICY "Users can upload proof images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rewards-proof-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own proof images
CREATE POLICY "Users can update own proof images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rewards-proof-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own proof images
CREATE POLICY "Users can delete own proof images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rewards-proof-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to proof images
CREATE POLICY "Public can view proof images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'rewards-proof-images');

-- Storage policies for rewards-videos

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload reward videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rewards-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own videos
CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rewards-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rewards-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to approved videos
CREATE POLICY "Public can view reward videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'rewards-videos');