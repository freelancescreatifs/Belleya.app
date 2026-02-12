/*
  # Optimize Training Related Tables (Fixed)

  1. Tables Optimized
    - student_trainings
    - student_documents
    - training_programs
    
  2. Performance
    - Simple EXISTS checks with indexed student_id
    - Critical indexes for joins
    - Dramatically improve Training page load
*/

-- ============================================
-- STUDENT_TRAININGS
-- ============================================
DROP POLICY IF EXISTS "Users can view trainings from their company students" ON student_trainings;
DROP POLICY IF EXISTS "Users can insert trainings for their company students" ON student_trainings;
DROP POLICY IF EXISTS "Users can update trainings from their company students" ON student_trainings;
DROP POLICY IF EXISTS "Users can delete trainings from their company students" ON student_trainings;

CREATE POLICY "Users can view trainings from their company students"
  ON student_trainings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_trainings.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert trainings for their company students"
  ON student_trainings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_trainings.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can update trainings from their company students"
  ON student_trainings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_trainings.student_id 
      AND students.company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_trainings.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can delete trainings from their company students"
  ON student_trainings FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_trainings.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_student_trainings_student_id 
ON student_trainings(student_id);

-- ============================================
-- STUDENT_DOCUMENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view documents from their company students" ON student_documents;
DROP POLICY IF EXISTS "Users can insert documents for their company students" ON student_documents;
DROP POLICY IF EXISTS "Users can update documents from their company students" ON student_documents;
DROP POLICY IF EXISTS "Users can delete documents from their company students" ON student_documents;

CREATE POLICY "Users can view documents from their company students"
  ON student_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_documents.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert documents for their company students"
  ON student_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_documents.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can update documents from their company students"
  ON student_documents FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_documents.student_id 
      AND students.company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_documents.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can delete documents from their company students"
  ON student_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_documents.student_id 
      AND students.company_id = get_user_company_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_student_documents_student_id 
ON student_documents(student_id);

-- ============================================
-- TRAINING_PROGRAMS (public/global data)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view training programs" ON training_programs;

-- Tous les utilisateurs authentifiés peuvent voir les programmes
CREATE POLICY "Anyone can view training programs"
  ON training_programs FOR SELECT TO authenticated
  USING (true);

-- Analyser toutes les tables
ANALYZE student_trainings;
ANALYZE student_documents;
ANALYZE training_programs;
ANALYZE students;
