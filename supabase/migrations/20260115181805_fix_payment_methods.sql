/*
  # Correction des modes de paiement

  1. Modifications
    - Élargit la contrainte CHECK sur payment_method dans la table revenues
    - Ajoute les options 'card' et 'paypal' aux modes de paiement acceptés

  2. Sécurité
    - Les policies RLS existantes restent inchangées
*/

-- Supprimer l'ancienne contrainte sur payment_method
ALTER TABLE revenues
  DROP CONSTRAINT IF EXISTS revenues_payment_method_check;

-- Ajouter la nouvelle contrainte avec tous les modes de paiement
ALTER TABLE revenues
  ADD CONSTRAINT revenues_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'paypal', 'transfer', 'other'));
