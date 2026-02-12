/*
  # Optimize Critical Tables RLS (Correct Columns)

  1. Tables Optimized
    - clients (has company_id)
    - events (has company_id)
    - content_calendar (has company_id)
    - tasks (has company_id)
    - revenues (has user_id only)
    
  2. Performance
    - Use cached get_user_company_id() function
    - Reduce subqueries from O(n) to O(1) per transaction
    - Add missing indexes
*/

-- ============================================
-- CLIENTS (company_id exists)
-- ============================================
DROP POLICY IF EXISTS "Users can view clients from their company" ON clients;
DROP POLICY IF EXISTS "Users can insert clients for their company" ON clients;
DROP POLICY IF EXISTS "Users can update clients from their company" ON clients;
DROP POLICY IF EXISTS "Users can delete clients from their company" ON clients;

CREATE POLICY "Users can view clients from their company"
  ON clients FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert clients for their company"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update clients from their company"
  ON clients FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete clients from their company"
  ON clients FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ============================================
-- EVENTS (company_id exists)
-- ============================================
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id = get_user_company_id());

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR company_id = get_user_company_id())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR company_id = get_user_company_id());

-- ============================================
-- CONTENT_CALENDAR (company_id exists)
-- ============================================
DROP POLICY IF EXISTS "Users can view own content" ON content_calendar;
DROP POLICY IF EXISTS "Users can insert own content" ON content_calendar;
DROP POLICY IF EXISTS "Users can update own content" ON content_calendar;
DROP POLICY IF EXISTS "Users can delete own content" ON content_calendar;

CREATE POLICY "Users can view own content"
  ON content_calendar FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert own content"
  ON content_calendar FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own content"
  ON content_calendar FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete own content"
  ON content_calendar FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ============================================
-- TASKS (company_id exists)
-- ============================================
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ============================================
-- REVENUES (user_id only, no company_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view own revenues" ON revenues;
DROP POLICY IF EXISTS "Users can insert own revenues" ON revenues;
DROP POLICY IF EXISTS "Users can update own revenues" ON revenues;
DROP POLICY IF EXISTS "Users can delete own revenues" ON revenues;

CREATE POLICY "Users can view own revenues"
  ON revenues FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own revenues"
  ON revenues FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own revenues"
  ON revenues FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own revenues"
  ON revenues FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Index pour revenues
CREATE INDEX IF NOT EXISTS idx_revenues_user_id 
ON revenues(user_id);

-- Analyser toutes les tables
ANALYZE clients;
ANALYZE events;
ANALYZE content_calendar;
ANALYZE tasks;
ANALYZE revenues;
