/*
  # Correction de la contrainte legal_status

  1. Problème
    - La migration 20260122203200 a réintroduit les anciennes valeurs (auto_entreprise, etc.)
    - Le frontend utilise les nouvelles valeurs (MICRO, EI, SASU_EURL, OTHER)
    - Cela crée une erreur de contrainte lors de la sauvegarde

  2. Solution
    - Mise à jour des données existantes vers les nouvelles valeurs
    - Suppression de l'ancienne contrainte
    - Recréation de la contrainte avec les nouvelles valeurs (MICRO, EI, SASU_EURL, OTHER)

  3. Valeurs
    - MICRO : Micro-entreprise / auto-entrepreneur
    - EI : Entreprise individuelle
    - SASU_EURL : SASU / EURL
    - OTHER : Autre statut juridique

  4. Sécurité
    - Les données existantes sont migrées en toute sécurité
    - La contrainte permet NULL (profil public sans statut fiscal)
*/

-- Mettre à jour les valeurs existantes vers le nouveau format
UPDATE company_profiles
SET legal_status = CASE
  WHEN legal_status = 'auto_entreprise' THEN 'MICRO'
  WHEN legal_status = 'entreprise_individuelle' THEN 'EI'
  WHEN legal_status = 'sasu_eurl' THEN 'SASU_EURL'
  WHEN legal_status = 'autre' THEN 'OTHER'
  ELSE legal_status
END
WHERE legal_status IN ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl', 'autre');

-- Supprimer l'ancienne contrainte
ALTER TABLE company_profiles 
  DROP CONSTRAINT IF EXISTS company_profiles_legal_status_check;

ALTER TABLE company_profiles 
  DROP CONSTRAINT IF EXISTS legal_status_check;

-- Recréer la contrainte avec les nouvelles valeurs
ALTER TABLE company_profiles 
  ADD CONSTRAINT legal_status_check 
  CHECK (legal_status IS NULL OR legal_status IN ('MICRO', 'EI', 'SASU_EURL', 'OTHER'));
