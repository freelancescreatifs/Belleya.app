/*
  # Add photo to reviews
  
  1. Changes
    - Add `photo_url` column to reviews table to allow clients to attach a photo to their review
  
  2. Notes
    - Photos will be stored in a 'review-photos' storage bucket
    - This helps clients share visual results of their service experience
*/

-- Add photo_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE reviews 
    ADD COLUMN photo_url text;
  END IF;
END $$;

-- Create review-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos
DO $$
BEGIN
  -- Allow authenticated users to upload their own review photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload review photos'
  ) THEN
    CREATE POLICY "Users can upload review photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'review-photos');
  END IF;

  -- Allow public read access to review photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view review photos'
  ) THEN
    CREATE POLICY "Public can view review photos"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'review-photos');
  END IF;

  -- Allow users to delete their own review photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their review photos'
  ) THEN
    CREATE POLICY "Users can delete their review photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;