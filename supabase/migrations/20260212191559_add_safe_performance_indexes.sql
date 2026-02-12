/*
  # Add Safe Performance Indexes

  1. New Indexes
    - Only create indexes on columns that definitely exist
    - Focus on most critical tables
    
  2. Priority
    - user_roles for admin checks
    - company_profiles
    - events
*/

-- Index CRITIQUE pour user_roles (vérifié existant)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON user_roles(user_id, role) WHERE role = 'admin';

-- Index pour company_profiles (vérifié existant)
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id 
ON company_profiles(user_id);

-- Index pour events (vérifié existant)
CREATE INDEX IF NOT EXISTS idx_events_company_id_start 
ON events(company_id, start_at) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_user_id_start 
ON events(user_id, start_at);

-- Index pour clients
CREATE INDEX IF NOT EXISTS idx_clients_company_id 
ON clients(company_id);

-- Analyser les tables critiques
ANALYZE user_roles;
ANALYZE company_profiles;
ANALYZE events;
ANALYZE clients;
