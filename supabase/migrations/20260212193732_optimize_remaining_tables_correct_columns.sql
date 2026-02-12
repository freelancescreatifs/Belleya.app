/*
  # Optimize Remaining Tables (Correct Columns)

  1. Tables Optimized
    - goals (user_id)
    - projects (company_id + user_id)
    - stock_items (user_id)
    - partnerships (user_id)
    - subscriptions (company_id)
    
  2. Performance
    - Simple direct checks
    - Add missing indexes
*/

-- ============================================
-- GOALS (user_id only)
-- ============================================
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ============================================
-- PROJECTS (company_id + user_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id = get_user_company_id());

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR company_id = get_user_company_id())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR company_id = get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

-- ============================================
-- STOCK_ITEMS (user_id only)
-- ============================================
DROP POLICY IF EXISTS "Users can view own stock" ON stock_items;
DROP POLICY IF EXISTS "Users can insert own stock" ON stock_items;
DROP POLICY IF EXISTS "Users can update own stock" ON stock_items;
DROP POLICY IF EXISTS "Users can delete own stock" ON stock_items;

CREATE POLICY "Users can view own stock"
  ON stock_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stock"
  ON stock_items FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stock"
  ON stock_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own stock"
  ON stock_items FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_stock_items_user_id ON stock_items(user_id);

-- ============================================
-- PARTNERSHIPS (user_id only)
-- ============================================
DROP POLICY IF EXISTS "Users can view own partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can insert own partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can update own partnerships" ON partnerships;
DROP POLICY IF EXISTS "Users can delete own partnerships" ON partnerships;

CREATE POLICY "Users can view own partnerships"
  ON partnerships FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own partnerships"
  ON partnerships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own partnerships"
  ON partnerships FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own partnerships"
  ON partnerships FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_partnerships_user_id ON partnerships(user_id);

-- ============================================
-- SUBSCRIPTIONS (company_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- Analyser
ANALYZE goals;
ANALYZE projects;
ANALYZE stock_items;
ANALYZE partnerships;
ANALYZE subscriptions;
