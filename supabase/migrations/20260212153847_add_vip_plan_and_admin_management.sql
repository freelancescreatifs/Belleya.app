/*
  # Ajout du plan VIP et gestion admin des abonnements

  1. Modifications
    - Ajout du plan 'vip' aux contraintes de plan_type
    - Ajout de 'admin' aux payment_provider acceptés
    - Création de l'abonnement VIP pour Sabrina Benaceur
    - Création de l'abonnement VIP pour Noemie Aubree
    - Ajout d'une colonne pour tracking de qui a créé/modifié l'abonnement
  
  2. Notes
    - Le plan VIP donne un accès gratuit illimité à Empire
    - Seuls les admins peuvent attribuer ce plan
    - Les VIP ne paient jamais et n'ont pas de date d'expiration
*/

-- Mettre à jour la contrainte pour inclure le plan VIP
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check 
  CHECK (plan_type IN ('start', 'studio', 'empire', 'vip'));

-- Mettre à jour la contrainte payment_provider pour inclure 'admin'
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_provider_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_payment_provider_check
  CHECK (payment_provider IN ('stripe', 'paypal', 'admin'));

-- Ajouter une colonne pour tracer qui a modifié l'abonnement
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS modified_by_admin_id uuid REFERENCES auth.users(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS admin_note text;

-- Mettre à jour l'abonnement pour Sabrina Benaceur
UPDATE subscriptions 
SET 
  plan_type = 'vip',
  subscription_status = 'active',
  trial_end_date = NULL,
  payment_provider = 'admin',
  payment_provider_subscription_id = 'admin_vip',
  monthly_price = 0,
  modified_by_admin_id = 'eb81e6fd-4d38-4f31-9598-7b48998096d6',
  admin_note = 'VIP access granted by admin - Unlimited Empire access',
  updated_at = now()
WHERE company_id = '629d2ec8-84b6-43f4-8f94-deeb185989ed';

-- Créer l'abonnement VIP pour Noemie Aubree si elle n'en a pas
INSERT INTO subscriptions (
  company_id,
  plan_type,
  subscription_status,
  trial_start_date,
  payment_provider,
  payment_provider_subscription_id,
  monthly_price,
  modified_by_admin_id,
  admin_note
)
SELECT 
  '3a5a7245-84bc-41de-8747-7df0edb157c8',
  'vip',
  'active',
  now(),
  'admin',
  'admin_vip',
  0,
  'eb81e6fd-4d38-4f31-9598-7b48998096d6',
  'VIP access granted by admin - Unlimited Empire access'
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE company_id = '3a5a7245-84bc-41de-8747-7df0edb157c8'
);

-- Donner le rôle admin à Noemie aussi
INSERT INTO user_roles (user_id, role)
VALUES ('ebfaafa3-0203-4ed9-8c1f-ed1805f328ff', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
