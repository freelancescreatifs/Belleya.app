/*
 * BELLEYA STORAGE BUCKETS & POLICIES
 *
 * This script creates all storage buckets and their associated RLS policies
 * for the Belleya project.
 *
 * IMPORTANT: Execute this AFTER creating the buckets manually in the Supabase UI.
 * This script only creates the policies, not the buckets themselves.
 */

-- ============================================================================
-- BUCKET: content-media (public)
-- Usage: Images and videos for social media content
-- ============================================================================

-- Public read access
CREATE POLICY "Public can view content media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-media');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload content media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-media');

-- Users can update their own files
CREATE POLICY "Users can update own content media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own content media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- BUCKET: service-photos (public)
-- Usage: Photos of services/treatments (before/after, examples)
-- ============================================================================

-- Public read access
CREATE POLICY "Public can view service photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-photos');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload service photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

-- Users can update their own files
CREATE POLICY "Users can update own service photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own service photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- BUCKET: project-images (public)
-- Usage: Images for projects (tasks, goals)
-- ============================================================================

-- Public read access
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Users can update their own files
CREATE POLICY "Users can update own project images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own project images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- BUCKET: student-documents (private)
-- Usage: Private documents for students/trainees (contracts, certificates)
-- ============================================================================

-- Authenticated users can view their own documents
CREATE POLICY "Users can view own student documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own student documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update own student documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete own student documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all storage policies
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'storage'
-- ORDER BY tablename, cmd, policyname;

-- List all buckets
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- ORDER BY name;
