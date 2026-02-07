/*
  # Create Storage Bucket for Project Images

  1. New Bucket
    - `project-images` bucket for storing project photos
    - Public access for reading
    - Authenticated users can upload

  2. Security
    - RLS policies for upload, update, delete
    - Public read access
    - Users can only manage their own project images
*/

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload project images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload project images'
  ) THEN
    CREATE POLICY "Authenticated users can upload project images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'project-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to update their own project images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own project images'
  ) THEN
    CREATE POLICY "Users can update own project images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'project-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to delete their own project images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own project images'
  ) THEN
    CREATE POLICY "Users can delete own project images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'project-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view project images'
  ) THEN
    CREATE POLICY "Public can view project images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'project-images');
  END IF;
END $$;