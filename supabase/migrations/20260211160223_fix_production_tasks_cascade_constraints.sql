/*
  # Fix Production Tasks CASCADE Constraints

  ## Changes
  - Drop and recreate foreign key constraints on production_tasks with proper ON DELETE CASCADE
  - This ensures that when content or tasks are deleted, production_tasks are automatically deleted

  ## Important
  - This fixes the cascade deletion behavior
  - When a content_calendar entry is deleted, all its production_tasks will be deleted
  - When a task is deleted, the corresponding production_tasks entry will be deleted
*/

-- Drop existing foreign key constraints
ALTER TABLE production_tasks 
  DROP CONSTRAINT IF EXISTS production_tasks_content_id_fkey;

ALTER TABLE production_tasks 
  DROP CONSTRAINT IF EXISTS production_tasks_task_id_fkey;

-- Recreate with proper CASCADE behavior
ALTER TABLE production_tasks
  ADD CONSTRAINT production_tasks_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES content_calendar(id) ON DELETE CASCADE;

ALTER TABLE production_tasks
  ADD CONSTRAINT production_tasks_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
