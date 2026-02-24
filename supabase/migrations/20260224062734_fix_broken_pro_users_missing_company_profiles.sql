/*
  # Fix broken pro users missing company_profiles

  ## Problem
  Users created via the admin-create-user Edge Function had their company_profiles
  creation silently fail because a manual upsert into user_profiles was overwriting
  the trigger-set company_id with NULL. This left 3 pro users without company_profiles,
  subscriptions, or functional accounts.

  ## Fix
  1. Insert missing company_profiles for all pro users who lack one
  2. The existing trigger `sync_company_id_to_user_profile` will automatically
     set company_id on user_profiles
  3. The existing trigger `auto_create_trial_subscription` will automatically
     create a trial subscription for each new company_profile

  ## Affected Users
  - All user_profiles with role='pro' that have no matching company_profiles row
*/

INSERT INTO company_profiles (
  user_id,
  company_name,
  activity_type,
  creation_date,
  country,
  legal_status,
  vat_mode,
  acre,
  versement_liberatoire
)
SELECT
  up.user_id,
  COALESCE(
    NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
    SPLIT_PART(au.email, '@', 1),
    'Mon Entreprise'
  ),
  'onglerie',
  CURRENT_DATE,
  'France',
  'MICRO',
  'VAT_FRANCHISE',
  false,
  false
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
LEFT JOIN company_profiles cp ON cp.user_id = up.user_id
WHERE up.role = 'pro'
  AND cp.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
