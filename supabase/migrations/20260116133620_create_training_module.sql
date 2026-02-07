/*
  # Training Module Schema

  ## Overview
  This migration creates the complete training management system for educational institutions
  and trainers to manage students, training programs, and administrative documents.

  ## New Tables

  ### 1. students
  Main table storing student information
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key) - Multi-tenant isolation
  - `first_name` (text) - Student first name
  - `last_name` (text) - Student last name
  - `instagram_username` (text, nullable) - Instagram handle
  - `email` (text, nullable) - Contact email
  - `phone` (text, nullable) - Contact phone
  - `status` (text) - Student status: 'upcoming', 'in_progress', 'completed'
  - `internal_notes` (text, nullable) - Private notes for trainer
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. training_programs
  Available training programs/courses
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key) - Multi-tenant isolation
  - `name` (text) - Program name (e.g., "Advanced Nail Art")
  - `description` (text, nullable) - Program description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. student_trainings
  Junction table linking students to training programs with dates
  - `id` (uuid, primary key)
  - `student_id` (uuid, foreign key) - References students
  - `training_program_id` (uuid, foreign key) - References training_programs
  - `training_date` (date) - Scheduled or actual training date
  - `status` (text) - Training status: 'upcoming', 'in_progress', 'completed'
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. student_documents
  Document management for each student
  - `id` (uuid, primary key)
  - `student_id` (uuid, foreign key) - References students
  - `document_type` (text) - Type of document (see enum below)
  - `document_stage` (text) - Stage: 'before', 'during', 'after'
  - `file_path` (text) - Path in Supabase Storage
  - `uploaded_at` (timestamptz) - Upload timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Document Types by Stage

  ### Before Training:
  - contract - Training contract/agreement
  - signed_quote - Signed quote/estimate
  - training_program_doc - Training program document
  - signed_rules - Signed internal rules

  ### During Training:
  - attendance_sheets - Attendance/signature sheets
  - training_materials - Training support materials
  - skills_assessment - Skills evaluation
  - satisfaction_survey - Satisfaction questionnaire

  ### After Training:
  - completion_certificate - Certificate of completion
  - invoice - Final invoice

  ## Security
  All tables have RLS enabled with policies ensuring:
  - Users can only access their company's data (company_id match)
  - Full CRUD access for authenticated users within their company
  - No public access

  ## Indexes
  - Foreign keys for optimal join performance
  - company_id indexes for multi-tenant queries
  - Status indexes for filtering

  ## Storage Bucket
  - Creates 'student-documents' bucket for file uploads
  - Restricted to authenticated users
  - Company-based folder structure
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  instagram_username text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_programs table
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_trainings junction table
CREATE TABLE IF NOT EXISTS student_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  training_program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  training_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_documents table
CREATE TABLE IF NOT EXISTS student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'contract', 'signed_quote', 'training_program_doc', 'signed_rules',
    'attendance_sheets', 'training_materials', 'skills_assessment', 'satisfaction_survey',
    'completion_certificate', 'invoice'
  )),
  document_stage text NOT NULL CHECK (document_stage IN ('before', 'during', 'after')),
  file_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_company_id ON students(company_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_training_programs_company_id ON training_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_student_id ON student_trainings(student_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_status ON student_trainings(status);
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Users can view students from their company"
  ON students FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert students for their company"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update students from their company"
  ON students FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete students from their company"
  ON students FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for training_programs table
CREATE POLICY "Users can view training programs from their company"
  ON training_programs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert training programs for their company"
  ON training_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update training programs from their company"
  ON training_programs FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete training programs from their company"
  ON training_programs FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for student_trainings table
CREATE POLICY "Users can view student trainings for their students"
  ON student_trainings FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert student trainings for their students"
  ON student_trainings FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update student trainings for their students"
  ON student_trainings FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete student trainings for their students"
  ON student_trainings FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for student_documents table
CREATE POLICY "Users can view documents for their students"
  ON student_documents FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert documents for their students"
  ON student_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update documents for their students"
  ON student_documents FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete documents for their students"
  ON student_documents FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student-documents bucket
CREATE POLICY "Authenticated users can upload student documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can view their student documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can update their student documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'student-documents')
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can delete their student documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'student-documents');