/*
  # Mettre à jour les valeurs par défaut des vues sociales
  
  1. Modifications
    - `social_views.viewByPostType` : false (au lieu de true)
    - `social_views.productionCalendar` : false (au lieu de true)
    
  2. Raison
    - Par défaut, cacher la vue par type de post et le calendrier de production
    - L'utilisateur peut les activer manuellement via les paramètres
    
  3. Impact
    - Change les defaults pour les nouveaux utilisateurs
    - Met à jour les utilisateurs existants
*/

-- Mettre à jour le default de la colonne social_views
ALTER TABLE menu_preferences 
  ALTER COLUMN social_views SET DEFAULT '{"viewByPostType": false, "productionCalendar": false}'::jsonb;

-- Mettre à jour tous les enregistrements existants
UPDATE menu_preferences
SET 
  social_views = '{"viewByPostType": false, "productionCalendar": false}'::jsonb,
  updated_at = now()
WHERE social_views->>'viewByPostType' = 'true'
  OR social_views->>'productionCalendar' = 'true';