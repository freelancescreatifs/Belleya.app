/*
  # Add "other" document type and renaming capability

  ## Description
  This migration enhances the student documents system by:
  1. Adding 'other' as a valid document type for all stages (before, during, after)
  2. Adding a custom_name field to allow document renaming

  ## Changes
  1. Modify student_documents table
     - Drop existing CHECK constraint on document_type
     - Add new constraint including 'other' type
     - Add custom_name field for user-friendly document names

  ## New Document Types
  - Before: contract, signed_quote, training_program_doc, signed_rules, other
  - During: attendance_sheets, training_materials, skills_assessment, satisfaction_survey, other
  - After: completion_certificate, invoice, other

  ## Safety
  - Uses DROP CONSTRAINT IF EXISTS to prevent errors
  - Preserves existing data
  - custom_name is nullable (defaults to file name if not set)
*/

-- Add custom_name column for document renaming
ALTER TABLE student_documents 
ADD COLUMN IF NOT EXISTS custom_name text;

-- Drop old constraint
DO $$ 
BEGIN
  ALTER TABLE student_documents 
  DROP CONSTRAINT IF EXISTS student_documents_document_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with 'other' type included
ALTER TABLE student_documents
ADD CONSTRAINT student_documents_document_type_check
CHECK (document_type IN (
  'contract', 'signed_quote', 'training_program_doc', 'signed_rules',
  'attendance_sheets', 'training_materials', 'skills_assessment', 'satisfaction_survey',
  'completion_certificate', 'invoice',
  'other'
));
