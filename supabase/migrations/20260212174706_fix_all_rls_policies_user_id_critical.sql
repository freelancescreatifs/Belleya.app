/*
  # Fix critical RLS policies - user_profiles.id -> user_profiles.user_id

  1. Problem
    - Many policies use user_profiles.id = auth.uid()
    - Should use user_profiles.user_id = auth.uid()
    - This blocks ALL pro users from accessing their data
    
  2. Tables Fixed
    - clients
    - events
    - students
    - student_documents
    - student_trainings
    - training_programs
    - tasks
    
  3. Security
    - Maintains same security level
    - Only fixes the column reference
*/

-- ============================================
-- CLIENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- EVENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STUDENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view students from their company" ON students;
DROP POLICY IF EXISTS "Users can update students from their company" ON students;
DROP POLICY IF EXISTS "Users can delete students from their company" ON students;

CREATE POLICY "Users can view students from their company"
  ON students FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update students from their company"
  ON students FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete students from their company"
  ON students FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STUDENT_DOCUMENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view documents for their students" ON student_documents;
DROP POLICY IF EXISTS "Users can update documents for their students" ON student_documents;
DROP POLICY IF EXISTS "Users can delete documents for their students" ON student_documents;

CREATE POLICY "Users can view documents for their students"
  ON student_documents FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update documents for their students"
  ON student_documents FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete documents for their students"
  ON student_documents FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- STUDENT_TRAININGS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view student trainings for their students" ON student_trainings;
DROP POLICY IF EXISTS "Users can update student trainings for their students" ON student_trainings;
DROP POLICY IF EXISTS "Users can delete student trainings for their students" ON student_trainings;

CREATE POLICY "Users can view student trainings for their students"
  ON student_trainings FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update student trainings for their students"
  ON student_trainings FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete student trainings for their students"
  ON student_trainings FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE company_id IN (
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- TRAINING_PROGRAMS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view training programs from their company" ON training_programs;
DROP POLICY IF EXISTS "Users can update training programs from their company" ON training_programs;
DROP POLICY IF EXISTS "Users can delete training programs from their company" ON training_programs;

CREATE POLICY "Users can view training programs from their company"
  ON training_programs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update training programs from their company"
  ON training_programs FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete training programs from their company"
  ON training_programs FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TASKS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view company tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update company tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete company tasks" ON tasks;

CREATE POLICY "Users can view company tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete company tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );
