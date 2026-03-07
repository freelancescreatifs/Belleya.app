/*
  # Add company_id to content_ideas table

  1. Changes
    - Add `company_id` column to `content_ideas` table
    - Create foreign key reference to `company_profiles`
    - Add index for performance

  2. Migration
    - Populate existing records using user_id to find company_id
    - Make column NOT NULL for new records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN company_id uuid;
    
    ALTER TABLE content_ideas 
    ADD CONSTRAINT content_ideas_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE;
    
    UPDATE content_ideas ci
    SET company_id = cp.id
    FROM company_profiles cp
    WHERE ci.user_id = cp.user_id;
    
    CREATE INDEX IF NOT EXISTS content_ideas_company_id_idx ON content_ideas(company_id);
  END IF;
END $$;
