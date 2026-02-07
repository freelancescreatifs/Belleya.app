/*
  # Mettre à jour les valeurs par défaut des vues de contenu
  
  1. Modifications
    - `production_calendar_enabled` : DEFAULT false (au lieu de true)
    - `type_view_enabled` : DEFAULT false (au lieu de true)
    
  2. Raison
    - Par défaut, cacher le calendrier de production et la vue par type de post
    - L'utilisateur peut les activer manuellement via les paramètres
    
  3. Impact
    - Change les defaults pour les nouveaux utilisateurs
    - Met à jour les utilisateurs existants qui n'ont pas encore modifié ces préférences
*/

-- Mettre à jour les defaults de la table
ALTER TABLE content_view_preferences 
  ALTER COLUMN production_calendar_enabled SET DEFAULT false,
  ALTER COLUMN type_view_enabled SET DEFAULT false;

-- Mettre à jour les enregistrements existants pour appliquer les nouveaux defaults
-- (Uniquement pour ceux qui ont encore les valeurs par défaut à true)
UPDATE content_view_preferences
SET 
  production_calendar_enabled = false,
  type_view_enabled = false,
  updated_at = now()
WHERE production_calendar_enabled = true
  AND type_view_enabled = true;