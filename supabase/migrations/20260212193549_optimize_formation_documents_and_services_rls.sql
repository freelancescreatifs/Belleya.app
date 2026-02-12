/*
  # Optimize Formation Documents and Services RLS

  1. Changes
    - Optimize formation_documents RLS policies
    - Optimize services RLS policies  
    - Optimize user_documents RLS policies
    - Add critical indexes
    
  2. Performance
    - Replace nested subqueries with direct checks
    - Use indexes for fast lookups
*/

-- Optimiser services d'abord (utilisé par formation_documents)
DROP POLICY IF EXISTS "Users can view own services" ON services;
DROP POLICY IF EXISTS "Users can insert own services" ON services;
DROP POLICY IF EXISTS "Users can update own services" ON services;
DROP POLICY IF EXISTS "Users can delete own services" ON services;

-- Politiques services optimisées
CREATE POLICY "Users can view own services"
  ON services
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own services"
  ON services
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Index sur services
CREATE INDEX IF NOT EXISTS idx_services_user_id 
ON services(user_id);

-- Optimiser formation_documents
DROP POLICY IF EXISTS "Users can view own formation documents" ON formation_documents;
DROP POLICY IF EXISTS "Users can add formation documents to own services" ON formation_documents;
DROP POLICY IF EXISTS "Users can delete own formation documents" ON formation_documents;

-- Politiques formation_documents optimisées
CREATE POLICY "Users can view own formation documents"
  ON formation_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = formation_documents.service_id 
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add formation documents to own services"
  ON formation_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = formation_documents.service_id 
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own formation documents"
  ON formation_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = formation_documents.service_id 
      AND services.user_id = auth.uid()
    )
  );

-- Index sur formation_documents
CREATE INDEX IF NOT EXISTS idx_formation_documents_service_id 
ON formation_documents(service_id);

-- Optimiser user_documents
DROP POLICY IF EXISTS "Users can view own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can add own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON user_documents;

-- Politiques user_documents optimisées
CREATE POLICY "Users can view own documents"
  ON user_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add own documents"
  ON user_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON user_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON user_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Index sur user_documents
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
ON user_documents(user_id);

-- Analyser
ANALYZE services;
ANALYZE formation_documents;
ANALYZE user_documents;
