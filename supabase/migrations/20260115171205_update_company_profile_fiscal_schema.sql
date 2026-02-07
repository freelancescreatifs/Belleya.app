/*
  # Mise à jour du schéma fiscal du profil d'entreprise

  1. Modifications de la table company_profiles
    - Remplace legal_status par des enums normalisés (MICRO, EI, SASU_EURL, OTHER)
    - Ajoute tax_category avec enums détaillés pour tous les régimes
    - Remplace vat_enabled par vat_mode (VAT_FRANCHISE, VAT_LIABLE)
    - Renomme has_accre en acre
    - Renomme liberatory_payment en versement_liberatoire
    - Ajoute other_legal_status_label pour les statuts "Autre"
    - Supprime activity_category (remplacé par tax_category)
    - Supprime tax_regime (remplacé par tax_category)

  2. Logique métier
    - Statut MICRO : tax_category peut être MICRO_BNC, MICRO_BIC_SERVICES, MICRO_BIC_SALES
    - Statut EI : tax_category peut être BIC_REAL_SIMPLIFIED, BIC_REAL_NORMAL, BNC_CONTROLLED
    - Statut SASU_EURL : tax_category peut être IS, IR, BIC_SERVICES, BIC_SALES
    - Statut OTHER : tax_category nullable

  3. Sécurité
    - Les policies RLS existantes restent inchangées
*/

-- Ajouter les nouvelles colonnes avec les nouveaux enums
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS new_legal_status text,
  ADD COLUMN IF NOT EXISTS new_tax_category text,
  ADD COLUMN IF NOT EXISTS vat_mode text,
  ADD COLUMN IF NOT EXISTS acre boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS versement_liberatoire boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS other_legal_status_label text;

-- Migrer les données existantes vers le nouveau format
UPDATE company_profiles
SET
  new_legal_status = CASE
    WHEN legal_status = 'auto_entreprise' THEN 'MICRO'
    WHEN legal_status = 'entreprise_individuelle' THEN 'EI'
    WHEN legal_status = 'sasu_eurl' THEN 'SASU_EURL'
    WHEN legal_status = 'autre' THEN 'OTHER'
    ELSE 'MICRO'
  END,
  new_tax_category = CASE
    WHEN legal_status = 'auto_entreprise' AND activity_category = 'BNC' THEN 'MICRO_BNC'
    WHEN legal_status = 'auto_entreprise' AND activity_category = 'BIC' THEN 'MICRO_BIC_SERVICES'
    WHEN legal_status = 'auto_entreprise' THEN 'MICRO_BIC_SERVICES'
    WHEN legal_status = 'entreprise_individuelle' THEN 'BIC_REAL_SIMPLIFIED'
    WHEN legal_status = 'sasu_eurl' THEN 'IS'
    ELSE NULL
  END,
  vat_mode = CASE
    WHEN vat_enabled = true THEN 'VAT_LIABLE'
    ELSE 'VAT_FRANCHISE'
  END,
  acre = has_accre,
  versement_liberatoire = liberatory_payment
WHERE new_legal_status IS NULL;

-- Supprimer les anciennes colonnes
ALTER TABLE company_profiles
  DROP COLUMN IF EXISTS legal_status,
  DROP COLUMN IF EXISTS tax_regime,
  DROP COLUMN IF EXISTS has_accre,
  DROP COLUMN IF EXISTS vat_enabled,
  DROP COLUMN IF EXISTS liberatory_payment,
  DROP COLUMN IF EXISTS activity_category;

-- Renommer les nouvelles colonnes
ALTER TABLE company_profiles
  RENAME COLUMN new_legal_status TO legal_status;

ALTER TABLE company_profiles
  RENAME COLUMN new_tax_category TO tax_category;

-- Ajouter les contraintes
ALTER TABLE company_profiles
  ALTER COLUMN legal_status SET NOT NULL,
  ADD CONSTRAINT legal_status_check CHECK (legal_status IN ('MICRO', 'EI', 'SASU_EURL', 'OTHER')),
  ADD CONSTRAINT tax_category_check CHECK (
    tax_category IN (
      'MICRO_BNC', 'MICRO_BIC_SERVICES', 'MICRO_BIC_SALES',
      'BIC_REAL_SIMPLIFIED', 'BIC_REAL_NORMAL', 'BNC_CONTROLLED',
      'IS', 'IR', 'BIC_SERVICES', 'BIC_SALES'
    ) OR tax_category IS NULL
  ),
  ADD CONSTRAINT vat_mode_check CHECK (vat_mode IN ('VAT_FRANCHISE', 'VAT_LIABLE'));

-- Ajouter des contraintes NOT NULL pour les champs requis
ALTER TABLE company_profiles
  ALTER COLUMN vat_mode SET NOT NULL,
  ALTER COLUMN acre SET NOT NULL,
  ALTER COLUMN versement_liberatoire SET NOT NULL;
