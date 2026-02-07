# Guide Complet du Système de Paiement Belleya

## Vue d'ensemble

Système complet d'acompte en ligne avec **Stripe Connect** et **PayPal** pour permettre aux prestataires de recevoir des paiements directs de leurs clientes.

## Architecture

### 1. Base de données

**Tables créées** :

- `provider_payment_accounts` : Comptes de paiement des prestataires (Stripe / PayPal)
- `booking_payments` : Transactions de paiement pour les réservations
- `payment_webhooks_log` : Logs des webhooks pour idempotence et debugging

**Colonne ajoutée** :
- `bookings.payment_status` : État du paiement de la réservation

### 2. Edge Functions

#### Stripe

- **stripe-connect** : Onboarding Stripe Connect
  - `action=create` : Créer/récupérer un compte Connect et générer un lien d'onboarding
  - `action=status` : Récupérer le statut du compte (charges_enabled, payouts_enabled)
  - `action=dashboard` : Générer un lien vers le dashboard Stripe Express

- **stripe-payment** : Créer un paiement
  - Crée un PaymentIntent avec destination charge (Connect)
  - Commission plateforme : 5% (application_fee_amount)
  - Enregistre le paiement en base avec statut `pending`

- **stripe-webhook** : Gestion des webhooks Stripe
  - `payment_intent.succeeded` : Marque le paiement comme `paid`
  - `payment_intent.payment_failed` : Marque le paiement comme `failed`
  - `charge.refunded` : Marque le paiement comme `refunded`
  - `account.updated` : Met à jour le statut du compte Connect
  - Idempotence via `payment_webhooks_log`

#### PayPal

- **paypal-connect** : Onboarding PayPal Partner Referrals
  - `action=create` : Génère un lien d'onboarding via Partner Referrals API
  - `action=status` : Vérifie le statut du merchant (payments_receivable, email confirmé)

- **paypal-payment** : Créer un paiement PayPal
  - `action=create` : Crée un order PayPal avec platform_fees (5%)
  - `action=capture` : Capture le paiement après approbation

- **paypal-webhook** : Gestion des webhooks PayPal
  - `CHECKOUT.ORDER.APPROVED` : Passe le statut à `processing`
  - `PAYMENT.CAPTURE.COMPLETED` : Marque le paiement comme `paid`
  - `PAYMENT.CAPTURE.DENIED` : Marque le paiement comme `failed`
  - `PAYMENT.CAPTURE.REFUNDED` : Marque le paiement comme `refunded`
  - `MERCHANT.ONBOARDING.COMPLETED` : Active le compte prestataire

### 3. Composants Frontend

#### PaymentProviderSetup
**Emplacement** : `src/components/settings/PaymentProviderSetup.tsx`

**Responsabilités** :
- Afficher l'état de connexion Stripe et PayPal
- Boutons de connexion pour chaque provider
- Gestion des états : `pending`, `incomplete`, `active`, `disabled`
- Rafraîchissement du statut
- Accès au dashboard Stripe
- Avertissement si acompte activé sans moyen de paiement

**Intégration** :
- Utilisé dans `BookingSettings.tsx` (section Paiement en ligne)
- Affiché uniquement si `deposit_required` est activé

#### DepositPayment
**Emplacement** : `src/components/client/DepositPayment.tsx`

**Responsabilités** :
- Afficher le montant de l'acompte
- Choix entre Stripe et PayPal
- Paiement Stripe (Stripe Elements / Payment Intents)
- Paiement PayPal (redirection vers approve_link)
- Gestion des états de chargement et erreurs
- Confirmation de succès

**Utilisation future** :
- À intégrer dans le flux de réservation publique (`PublicBooking.tsx`)
- Appelé après validation de la réservation si `deposit_required = true`

## Flux utilisateur

### A) Onboarding Prestataire - Stripe

1. **Prestataire active l'acompte** dans "Profil public > Paramètres de réservation"
2. **Section "Paiement en ligne" apparaît** avec cartes Stripe et PayPal
3. **Clic sur "Connecter Stripe"** :
   - Edge Function `stripe-connect?action=create` appelée
   - Crée un compte Stripe Express
   - Génère un `accountLink` pour onboarding
   - Enregistre le compte dans `provider_payment_accounts` avec statut `pending`
   - Redirige vers Stripe pour compléter l'onboarding
4. **Retour après onboarding** :
   - URL de retour : `/settings?tab=profile&stripe_return=true`
   - Le frontend appelle `stripe-connect?action=status`
   - Met à jour le statut en base (`active` si charges_enabled + payouts_enabled)
5. **Si onboarding incomplet** :
   - Statut `incomplete`
   - Bouton "Compléter la configuration" réaffiche l'accountLink
6. **Si onboarding complet** :
   - Statut `active`
   - Badge vert "Connecté et actif"
   - Bouton "Accéder au dashboard Stripe"

### B) Onboarding Prestataire - PayPal

1. **Clic sur "Connecter PayPal"** :
   - Edge Function `paypal-connect?action=create` appelée
   - Crée un partner referral via PayPal Partner Referrals API
   - Enregistre le `tracking_id` dans `provider_payment_accounts`
   - Redirige vers le signup_link PayPal
2. **Retour après onboarding** :
   - URL de retour : `/settings?tab=profile&paypal_return=true`
   - Le frontend appelle `paypal-connect?action=status`
   - Récupère le merchant_id et vérifie `payments_receivable`
   - Met à jour le statut en `active` si tout est OK
3. **Webhook `MERCHANT.ONBOARDING.COMPLETED`** :
   - Confirme l'activation du compte
   - Met à jour `charges_enabled` et `payouts_enabled` en `true`

### C) Paiement d'acompte (côté cliente)

1. **Cliente réserve un RDV** via le widget de réservation publique
2. **Si `deposit_required = true`** :
   - Composant `DepositPayment` s'affiche
   - Charge les moyens de paiement disponibles (Stripe / PayPal)
3. **Cliente choisit Stripe** :
   - Edge Function `stripe-payment` appelée
   - Crée un PaymentIntent avec `destination` = `stripe_account_id`
   - Applique `application_fee_amount` (5%)
   - Retourne `clientSecret`
   - Frontend utilise Stripe.js pour confirmer le paiement
   - Webhook `payment_intent.succeeded` marque le paiement comme `paid`
   - Trigger DB met à jour `bookings.status = confirmed` et `payment_status = paid`
4. **Cliente choisit PayPal** :
   - Edge Function `paypal-payment?action=create` appelée
   - Crée un order PayPal avec `platform_fees` (5%)
   - Retourne `approveLink`
   - Redirige vers PayPal
   - Après approbation, webhook `PAYMENT.CAPTURE.COMPLETED` confirme le paiement
   - Marque le paiement comme `paid`

### D) Webhooks

#### Configuration Stripe

**URL du webhook** :
```
https://[PROJECT_ID].supabase.co/functions/v1/stripe-webhook
```

**Events à écouter** :
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`

**Configuration** :
1. Aller dans [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Créer un endpoint avec l'URL ci-dessus
3. Sélectionner les events
4. Copier le `webhook secret` (commence par `whsec_...`)
5. Ajouter le secret en variable d'environnement `STRIPE_WEBHOOK_SECRET`

#### Configuration PayPal

**URL du webhook** :
```
https://[PROJECT_ID].supabase.co/functions/v1/paypal-webhook
```

**Events à écouter** :
- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
- `MERCHANT.ONBOARDING.COMPLETED`

**Configuration** :
1. Aller dans [PayPal Developer Dashboard > Apps & Credentials](https://developer.paypal.com/dashboard/applications)
2. Sélectionner votre application
3. Ajouter un webhook avec l'URL ci-dessus
4. Sélectionner les events
5. Copier le `webhook ID`
6. Ajouter en variable d'environnement `PAYPAL_WEBHOOK_ID`

## Variables d'environnement

Les secrets suivants sont automatiquement configurés dans Supabase (ne pas les configurer manuellement) :

### Stripe

```bash
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
STRIPE_PUBLIC_KEY=pk_test_... ou pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayPal

```bash
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_PARTNER_ID=
PAYPAL_WEBHOOK_ID=
PAYPAL_MODE=sandbox ou live
```

### Supabase

```bash
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Sécurité

### 1. Row Level Security (RLS)

**Toutes les tables ont RLS activé** :

- **provider_payment_accounts** :
  - Les prestataires peuvent voir/modifier uniquement leurs propres comptes
  - Service role a accès complet (pour webhooks)

- **booking_payments** :
  - Les prestataires voient les paiements de leurs réservations
  - Les clientes voient leurs propres paiements
  - Service role a accès complet (pour webhooks)

- **payment_webhooks_log** :
  - Uniquement service role peut écrire
  - Les prestataires peuvent voir les logs liés à leurs paiements (debugging)

### 2. Validation des webhooks

- **Stripe** : Signature vérifiée via `stripe.webhooks.constructEvent()`
- **PayPal** : Event ID vérifié pour idempotence (à améliorer avec validation signature)

### 3. Idempotence

- Tous les webhooks vérifient `payment_webhooks_log` avant traitement
- Si `event_id` existe déjà, le webhook retourne `{ received: true, duplicate: true }`
- Évite les double-traitements

### 4. Empêcher l'activation d'acompte sans paiement

- Le composant `PaymentProviderSetup` affiche un avertissement si :
  - `deposit_required = true`
  - Aucun compte avec `status = active` n'existe

## Frais et commissions

### Structure tarifaire

**Commission plateforme** : **5%** sur chaque transaction

**Frais Stripe** (en plus de la commission plateforme) :
- Cartes européennes : 1,5% + 0,25€
- Cartes non-européennes : 2,9% + 0,25€

**Frais PayPal** (en plus de la commission plateforme) :
- Transactions nationales : 2,9% + 0,35€
- Transactions internationales : 4,4% + 0,35€

### Calcul

**Exemple avec Stripe** :
- Acompte : 20€
- Commission plateforme (5%) : 1€
- Frais Stripe (1,5% + 0,25€) : 0,55€
- **Prestataire reçoit** : 20€ - 1€ = **19€**
- **Plateforme reçoit** : **1€**
- **Stripe prélève** : 0,55€ (sur les 20€)

**Exemple avec PayPal** :
- Acompte : 20€
- Commission plateforme (5%) : 1€
- Frais PayPal (2,9% + 0,35€) : 0,93€
- **Prestataire reçoit** : 20€ - 1€ = **19€**
- **Plateforme reçoit** : **1€**
- **PayPal prélève** : 0,93€ (sur les 20€)

### Implémentation

**Stripe** :
```typescript
const applicationFeeAmount = Math.round(amount * 0.05);

const paymentIntent = await stripe.paymentIntents.create({
  amount: amount, // 2000 (20€)
  currency: 'eur',
  application_fee_amount: applicationFeeAmount, // 100 (1€)
  transfer_data: {
    destination: stripeAccountId,
  },
});
```

**PayPal** :
```typescript
const platformFee = (parseFloat(amount) * 0.05).toFixed(2);

payment_instruction: {
  platform_fees: [
    {
      amount: {
        currency_code: 'EUR',
        value: platformFee, // "1.00"
      },
    },
  ],
}
```

## Remboursements

### Stripe

1. Aller dans le [Stripe Dashboard](https://dashboard.stripe.com/payments)
2. Trouver le paiement
3. Cliquer sur "Refund"
4. Webhook `charge.refunded` met à jour automatiquement :
   - `booking_payments.status = 'refunded'` ou `'partially_refunded'`
   - `bookings.payment_status = 'refunded'` ou `'partially_refunded'`

### PayPal

1. Aller dans le [PayPal Dashboard](https://www.paypal.com/activity)
2. Trouver la transaction
3. Cliquer sur "Refund"
4. Webhook `PAYMENT.CAPTURE.REFUNDED` met à jour automatiquement

## Debugging

### Vérifier l'état d'un compte

```sql
SELECT * FROM provider_payment_accounts
WHERE company_id = '[COMPANY_ID]';
```

### Vérifier les paiements d'une réservation

```sql
SELECT * FROM booking_payments
WHERE booking_id = '[BOOKING_ID]';
```

### Voir les logs de webhooks

```sql
SELECT * FROM payment_webhooks_log
WHERE processed = false
ORDER BY created_at DESC
LIMIT 10;
```

### Vérifier les webhooks non traités

```sql
SELECT
  event_type,
  error,
  created_at
FROM payment_webhooks_log
WHERE processed = false
ORDER BY created_at DESC;
```

## Limites et améliorations futures

### Limites actuelles

1. **Pas de paiement en plusieurs fois** (installments)
2. **Pas de gestion de disputes/chargebacks** dans l'UI
3. **PayPal webhook signature validation** à améliorer
4. **Pas de rapport financier** intégré (utiliser les dashboards Stripe/PayPal)

### Améliorations possibles

1. **Dashboard financier** :
   - Vue globale des transactions
   - Graphiques de revenus
   - Export CSV

2. **Gestion des disputes** :
   - Alertes sur les chargebacks
   - Interface pour répondre aux disputes

3. **Paiements récurrents** :
   - Abonnements mensuels
   - Forfaits multi-séances

4. **Multi-devises** :
   - Support EUR, USD, GBP, etc.
   - Conversion automatique

5. **Split payments** :
   - Partage de revenus entre plusieurs prestataires
   - Commissions différenciées par type de service

6. **Apple Pay / Google Pay** :
   - Payment Request API
   - Paiement en un clic

## Support

### En cas de problème

1. **Vérifier les logs** dans `payment_webhooks_log`
2. **Consulter les dashboards Stripe/PayPal** pour les détails des transactions
3. **Vérifier les variables d'environnement** (Supabase Dashboard > Settings > Functions)
4. **Tester les webhooks** avec les outils de test Stripe/PayPal

### Contacts

- **Stripe Support** : https://support.stripe.com
- **PayPal Support** : https://www.paypal.com/businessmanage/support

---

**Date de mise à jour** : 1er février 2026
**Version** : 1.0
**Status** : Production Ready
