/*
  # Ajouter champ taxation_regime pour SASU/EURL

  1. Modifications
    - Ajoute taxation_regime (IS ou IR) pour gérer le régime d'imposition des SASU/EURL
    - tax_category pour SASU/EURL contiendra BIC_SERVICES ou BIC_SALES (le type d'activité)
    - taxation_regime sera NULL pour les autres statuts (MICRO, EI, OTHER)

  2. Logique
    - SASU_EURL : taxation_regime = IS ou IR + tax_category = BIC_SERVICES ou BIC_SALES
    - MICRO : taxation_regime = NULL, tax_category = MICRO_BNC/MICRO_BIC_SERVICES/MICRO_BIC_SALES
    - EI : taxation_regime = NULL, tax_category = BIC_REAL_SIMPLIFIED/BIC_REAL_NORMAL/BNC_CONTROLLED
    - OTHER : taxation_regime = NULL, tax_category = NULL
*/

-- Ajouter le champ taxation_regime
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS taxation_regime text;

-- Ajouter la contrainte pour taxation_regime
ALTER TABLE company_profiles
  ADD CONSTRAINT taxation_regime_check CHECK (
    taxation_regime IN ('IS', 'IR') OR taxation_regime IS NULL
  );

-- Migrer les données existantes : si tax_category = IS ou IR, déplacer vers taxation_regime
UPDATE company_profiles
SET
  taxation_regime = CASE
    WHEN tax_category IN ('IS', 'IR') THEN tax_category
    ELSE NULL
  END,
  tax_category = CASE
    WHEN tax_category IN ('IS', 'IR') THEN 'BIC_SERVICES'
    ELSE tax_category
  END
WHERE legal_status = 'SASU_EURL';
