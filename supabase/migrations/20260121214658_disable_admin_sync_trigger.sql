/*
  # Désactiver le trigger admin temporairement
  
  1. Problème
    - Le trigger `on_auth_user_created_sync_admin` appelle `sync_auth_user_to_admin()`
    - Cette fonction essaie d'insérer dans la table `admin_users`
    - La table `admin_users` N'EXISTE PAS
    - Résultat : signup échoue avec erreur 500
  
  2. Solution
    - Supprimer le trigger qui bloque les inscriptions
    - Supprimer la fonction obsolète
  
  3. Note
    - Si le système admin est nécessaire, il faudra le recréer proprement
    - Pour l'instant, priorité = débloquer les inscriptions
*/

-- ============================================================================
-- 1. Supprimer le trigger qui bloque
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_sync_admin ON auth.users;

-- ============================================================================
-- 2. Supprimer la fonction obsolète
-- ============================================================================

DROP FUNCTION IF EXISTS sync_auth_user_to_admin();

-- ============================================================================
-- 3. Confirmation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Trigger admin désactivé ===';
  RAISE NOTICE 'Le trigger sync_auth_user_to_admin a été supprimé';
  RAISE NOTICE 'Les inscriptions devraient maintenant fonctionner';
END $$;
