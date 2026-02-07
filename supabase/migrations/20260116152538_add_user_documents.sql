/*
  # Add user documents table

  ## Description
  This migration creates a table to store general reusable documents
  for users. These documents are centralized and can be used across
  different parts of the application.

  ## Changes
  1. Create user_documents table
     - Stores user's personal documents
     - Categorized for organization
     - No specific business logic - simple storage
  
  2. Security
     - Enable RLS
     - Users can only access their own documents

  ## New Table
  - `user_documents`
    - id (uuid, primary key)
    - user_id (uuid, foreign key to auth.users)
    - category (text) - 'administrative', 'personal', 'training', 'other'
    - file_path (text) - URL to the document
    - file_name (text) - Original file name
    - uploaded_at (timestamptz)
    - created_at (timestamptz)

  ## Safety
  - Uses IF NOT EXISTS to prevent errors
  - RLS enabled by default
  - Cascade deletion when user is deleted
*/

-- Create user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('administrative', 'personal', 'training', 'other')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  notes text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own documents
CREATE POLICY "Users can view own documents"
  ON user_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert own documents
CREATE POLICY "Users can add own documents"
  ON user_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own documents
CREATE POLICY "Users can update own documents"
  ON user_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete own documents
CREATE POLICY "Users can delete own documents"
  ON user_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id
ON user_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_documents_category
ON user_documents(category);