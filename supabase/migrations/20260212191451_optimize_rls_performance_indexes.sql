/*
  # Optimize RLS Performance with Indexes

  1. New Indexes
    - Add index on user_roles(user_id, role) for fast admin checks
    - Add index on user_profiles(user_id) for fast lookups
    - Add index on company_profiles(id) for joins
    
  2. Changes
    - Create composite indexes to speed up RLS policy checks
    - These indexes will make EXISTS() queries much faster
*/

-- Index pour accélérer les vérifications admin dans les politiques RLS
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON user_roles(user_id, role);

-- Index pour accélérer les lookups sur user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

-- Index pour accélérer les requêtes auth.uid()
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_role 
ON user_profiles(user_id, role);

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE user_roles;
ANALYZE user_profiles;
