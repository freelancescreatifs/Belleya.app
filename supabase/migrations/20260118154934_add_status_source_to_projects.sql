/*
  # Add status_source field to projects table
  
  ## Purpose
  Track whether project status was set manually or automatically by task completion.
  
  ## Changes
  1. Add `status_source` column to projects table
    - `manual`: User explicitly set the status
    - `auto`: Status was set automatically based on task completion
  
  2. Default to 'manual' for existing projects to preserve user control
  
  ## Security
  No security changes - existing RLS policies still apply
*/

-- Add status_source column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'status_source'
  ) THEN
    ALTER TABLE projects ADD COLUMN status_source text NOT NULL DEFAULT 'manual' CHECK (status_source IN ('manual', 'auto'));
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status_source ON projects(status_source);