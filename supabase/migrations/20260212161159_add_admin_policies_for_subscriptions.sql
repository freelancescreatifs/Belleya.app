/*
  # Ajouter les politiques RLS admin pour les abonnements

  1. Modifications
    - Ajouter politique DELETE pour les admins
    - Ajouter politique UPDATE pour les admins
    - Ajouter politique INSERT pour les admins
    
  2. Sécurité
    - Les admins peuvent modifier/supprimer tous les abonnements
    - Les admins sont identifiés via la table user_roles avec role = 'admin'
*/

-- Politique pour que les admins puissent modifier tous les abonnements
CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Politique pour que les admins puissent supprimer tous les abonnements
CREATE POLICY "Admins can delete all subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Politique pour que les admins puissent créer des abonnements pour n'importe quelle company
CREATE POLICY "Admins can insert any subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
