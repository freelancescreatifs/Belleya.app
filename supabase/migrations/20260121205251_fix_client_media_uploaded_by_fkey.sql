/*
  # Fix Client Media Gallery Foreign Key

  1. Changes
    - Drop incorrect foreign key constraints on uploaded_by
    - Recreate them to reference auth.users instead of user_profiles
    - This fixes the "violates foreign key constraint" error

  2. Security
    - Maintains data integrity while using correct user reference
*/

-- Fix client_inspirations.uploaded_by foreign key
ALTER TABLE client_inspirations
  DROP CONSTRAINT IF EXISTS client_inspirations_uploaded_by_fkey;

ALTER TABLE client_inspirations
  ADD CONSTRAINT client_inspirations_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Fix client_results_photos.uploaded_by foreign key
ALTER TABLE client_results_photos
  DROP CONSTRAINT IF EXISTS client_results_photos_uploaded_by_fkey;

ALTER TABLE client_results_photos
  ADD CONSTRAINT client_results_photos_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
