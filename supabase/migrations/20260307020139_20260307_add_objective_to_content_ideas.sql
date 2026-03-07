/*
  # Add objective column to content_ideas table

  1. Overview
    - Adds the missing 'objective' column to the content_ideas table
    - This column stores the content objective (e.g., 'attirer', 'engager', 'convertir')
    - Required for AI idea generation to work properly

  2. Changes
    - Added 'objective' text column to content_ideas table
    - Set default value to 'attirer' for existing records
    - Column is nullable to allow flexible data entry
*/

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS objective text DEFAULT 'attirer';
