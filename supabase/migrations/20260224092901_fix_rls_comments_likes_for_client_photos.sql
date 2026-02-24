/*
  # Fix RLS policies for comments and likes on client photos

  1. Problem
    - INSERT policies on `content_comments` and `content_likes` only check
      `content_calendar` table, blocking comments/likes on `client_results_photos`
    - SELECT policy on `content_comments` only checks `content_calendar`

  2. Changes
    - Drop restrictive INSERT policies that only check `content_calendar`
    - Replace with policies that check BOTH `content_calendar` AND `client_results_photos`
    - Add SELECT policy for comments on client photos
    - Add SELECT policy for likes on client photos

  3. Security
    - All policies still require `auth.uid() = user_id`
    - Content must be published (content_calendar) or visible in gallery (client_results_photos)
*/

-- Fix content_comments INSERT policy
DROP POLICY IF EXISTS "Users can comment on published content" ON content_comments;

CREATE POLICY "Users can comment on published content"
  ON content_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (content_type = 'content_calendar' AND EXISTS (
        SELECT 1 FROM content_calendar
        WHERE content_calendar.id = content_comments.content_id
        AND content_calendar.is_published = true
      ))
      OR
      (content_type = 'client_photo' AND EXISTS (
        SELECT 1 FROM client_results_photos
        WHERE client_results_photos.id = content_comments.content_id
        AND client_results_photos.show_in_gallery = true
      ))
    )
  );

-- Fix content_comments SELECT policy for published content
DROP POLICY IF EXISTS "Anyone can view comments on published content" ON content_comments;

CREATE POLICY "Anyone can view comments on published content"
  ON content_comments
  FOR SELECT
  TO authenticated
  USING (
    (content_type = 'content_calendar' AND EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_comments.content_id
      AND content_calendar.is_published = true
    ))
    OR
    (content_type = 'client_photo' AND EXISTS (
      SELECT 1 FROM client_results_photos
      WHERE client_results_photos.id = content_comments.content_id
      AND client_results_photos.show_in_gallery = true
    ))
  );

-- Fix content_likes INSERT policy
DROP POLICY IF EXISTS "Users can like published content" ON content_likes;

CREATE POLICY "Users can like published content"
  ON content_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (content_type = 'content_calendar' AND EXISTS (
        SELECT 1 FROM content_calendar
        WHERE content_calendar.id = content_likes.content_id
        AND content_calendar.is_published = true
      ))
      OR
      (content_type = 'client_photo' AND EXISTS (
        SELECT 1 FROM client_results_photos
        WHERE client_results_photos.id = content_likes.content_id
        AND client_results_photos.show_in_gallery = true
      ))
    )
  );

-- Fix content_likes SELECT policy for published content
DROP POLICY IF EXISTS "Users can view all likes on published content" ON content_likes;

CREATE POLICY "Users can view all likes on published content"
  ON content_likes
  FOR SELECT
  TO authenticated
  USING (
    (content_type = 'content_calendar' AND EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_likes.content_id
      AND content_calendar.is_published = true
    ))
    OR
    (content_type = 'client_photo' AND EXISTS (
      SELECT 1 FROM client_results_photos
      WHERE client_results_photos.id = content_likes.content_id
      AND client_results_photos.show_in_gallery = true
    ))
  );
