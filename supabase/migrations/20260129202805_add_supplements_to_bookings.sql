/*
  # Ajouter les suppléments aux réservations

  1. Modifications
    - Ajouter colonne `supplements` (jsonb) à la table `bookings`
      - Stockera les suppléments sélectionnés lors de la réservation
      - Format: array d'objets avec id, name, price, duration_minutes
    
  2. Raison
    - Permet de sauvegarder les suppléments choisis par le client
    - Conserve l'historique même si les suppléments sont modifiés plus tard
*/

-- Ajouter la colonne supplements à bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS supplements jsonb DEFAULT '[]'::jsonb;