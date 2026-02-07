/*
  # Add Comment Approval System

  1. Changes to `content_comments` table
    - Add `is_approved` column (boolean, default false) to allow providers to moderate comments
    - Add `provider_id` column to identify who can approve comments (the content owner)

  2. Security
    - Comments are only visible to the public if they are approved
    - Providers can see all comments on their content and approve them
    - Update RLS policies to enforce this behavior
*/

-- Add is_approved column to content_comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_comments' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE content_comments ADD COLUMN is_approved boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add provider_id column to content_comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_comments' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE content_comments ADD COLUMN provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_content_comments_is_approved ON content_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_content_comments_provider_id ON content_comments(provider_id);

-- Drop existing RLS policies for content_comments
DROP POLICY IF EXISTS "Users can view all comments" ON content_comments;
DROP POLICY IF EXISTS "Users can add comments" ON content_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON content_comments;

-- Create new RLS policies for content_comments with approval logic
CREATE POLICY "Authenticated users can view approved comments"
  ON content_comments FOR SELECT
  TO authenticated
  USING (is_approved = true OR provider_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Authenticated users can add comments"
  ON content_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON content_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can approve comments on their content"
  ON content_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Create a trigger to automatically set provider_id when a comment is created
CREATE OR REPLACE FUNCTION set_comment_provider_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  content_provider_id uuid;
BEGIN
  -- Get the provider_id based on content_type and content_id
  IF NEW.content_type = 'client_photo' THEN
    SELECT cp.user_id INTO content_provider_id
    FROM client_results_photos crp
    JOIN company_profiles cp ON crp.company_id = cp.id
    WHERE crp.id = NEW.content_id;
  ELSIF NEW.content_type = 'content_calendar' THEN
    SELECT cp.user_id INTO content_provider_id
    FROM content_calendar cc
    JOIN company_profiles cp ON cc.company_id = cp.id
    WHERE cc.id = NEW.content_id;
  ELSIF NEW.content_type = 'inspiration' THEN
    SELECT cp.user_id INTO content_provider_id
    FROM company_inspirations ci
    JOIN company_profiles cp ON ci.company_id = cp.id
    WHERE ci.id = NEW.content_id;
  END IF;

  NEW.provider_id := content_provider_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_comment_provider_id ON content_comments;
CREATE TRIGGER trigger_set_comment_provider_id
  BEFORE INSERT ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_provider_id();