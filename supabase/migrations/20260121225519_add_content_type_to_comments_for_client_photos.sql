/*
  # Add content_type support to content_comments for client_results_photos
  
  ## Changes
  - Drop foreign key constraint on content_comments.content_id
  - Add content_type column to content_comments to support multiple content sources
  - Add index for performance
  
  ## Purpose
  Allow comments to be added to both:
  - content_calendar entries (regular content posts)
  - client_results_photos (gallery results for "Pour toi" feed)
  
  ## Security
  - Existing RLS policies remain unchanged
*/

-- Drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%content_comments%content_id%' 
    AND table_name = 'content_comments'
  ) THEN
    ALTER TABLE content_comments DROP CONSTRAINT IF EXISTS content_comments_content_id_fkey;
  END IF;
END $$;

-- Add content_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_comments' 
    AND column_name = 'content_type'
  ) THEN
    ALTER TABLE content_comments ADD COLUMN content_type text DEFAULT 'content_calendar' NOT NULL 
    CHECK (content_type IN ('client_photo', 'content_calendar', 'inspiration'));
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS content_comments_content_idx ON content_comments(content_type, content_id);
