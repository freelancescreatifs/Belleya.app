/*
  # Fix Partnerships Foreign Key
  
  ## Problem
  La table partnerships référence l'ancienne table 'profiles' au lieu de 'user_profiles'.
  Cela bloque la création automatique des profils utilisateurs.
  
  ## Solution
  1. Supprimer l'ancienne foreign key vers profiles
  2. Ajouter une nouvelle foreign key vers user_profiles
  3. Corriger la fonction create_default_belleya_partnership pour utiliser user_id
*/

-- 1. Supprimer l'ancienne foreign key vers profiles
ALTER TABLE partnerships 
  DROP CONSTRAINT IF EXISTS partnerships_user_id_fkey;

-- 2. Ajouter la foreign key vers user_profiles
ALTER TABLE partnerships
  ADD CONSTRAINT partnerships_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- 3. Corriger la fonction pour utiliser NEW.user_id au lieu de NEW.id
CREATE OR REPLACE FUNCTION create_default_belleya_partnership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NEW.user_id car le trigger est sur user_profiles, pas auth.users
  INSERT INTO partnerships (
    user_id,
    company_name,
    partnership_type,
    commission_rate,
    compensation_mode,
    status,
    start_date,
    conditions,
    is_default,
    is_client_support_involved,
    notes
  ) VALUES (
    NEW.user_id,
    'Belleya',
    'affiliation',
    25,
    'recurring',
    'active',
    CURRENT_DATE,
    'Programme officiel Belleya - Commission mensuelle sur chaque vente HT. 25% par défaut, 30% si impliqué dans le service client.',
    true,
    false,
    'Partenariat officiel Belleya avec commission récurrente mensuelle.'
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;
