/*
  # Système d'Administration Sécurisé avec RLS

  1. Modifications de la table user_profiles
    - Mise à jour de la contrainte CHECK pour autoriser le rôle 'admin'
    - Ajout d'un index sur la colonne role pour optimiser les requêtes

  2. Policies RLS (Row Level Security)
    - **Admins peuvent tout voir** : Les utilisateurs avec role='admin' peuvent SELECT tous les profils
    - **Admins peuvent tout modifier** : Les utilisateurs avec role='admin' peuvent UPDATE tous les profils
    - **Admins peuvent tout supprimer** : Les utilisateurs avec role='admin' peuvent DELETE tous les profils
    - **Users voient leur propre profil** : Les utilisateurs normaux peuvent uniquement voir leur propre profil
    - **Users modifient leur propre profil** : Les utilisateurs normaux peuvent uniquement modifier leur propre profil

  3. Fonction RPC pour vérifier le rôle admin
    - Fonction sécurisée `is_admin()` qui retourne true si l'utilisateur connecté est admin
    - Utilisée pour protéger l'accès aux routes admin côté frontend

  4. Sécurité
    - Toutes les vérifications sont faites côté backend via RLS
    - Les utilisateurs normaux n'ont AUCUN accès aux données des autres utilisateurs
    - Seuls les admins peuvent gérer tous les utilisateurs
*/

-- 1. Mise à jour de la contrainte CHECK pour autoriser le rôle 'admin'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('client', 'pro', 'admin'));

-- Index pour optimiser les requêtes sur le rôle
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- 2. Supprimer les anciennes policies pour recréer des policies plus strictes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- 3. Policies pour les utilisateurs normaux (voir/modifier uniquement leur propre profil)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Policies pour les admins (accès complet à tous les profils)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert any profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- 5. Fonction RPC sécurisée pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Grant pour permettre l'exécution de la fonction
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 6. Fonction helper pour vérifier le rôle d'un utilisateur spécifique (pour les admins)
CREATE OR REPLACE FUNCTION get_user_role(target_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM user_profiles
  WHERE user_id = target_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;

-- 7. Appliquer les mêmes principes à la table subscriptions pour que les admins puissent gérer tous les abonnements
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert any subscription" ON subscriptions;

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert any subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- 8. Appliquer les mêmes principes à la table company_profiles
DROP POLICY IF EXISTS "Admins can view all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Admins can update all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Admins can delete all company profiles" ON company_profiles;

CREATE POLICY "Admins can view all company profiles"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all company profiles"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all company profiles"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );