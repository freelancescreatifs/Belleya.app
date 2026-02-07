# Référence Rapide : Configuration des Webhooks

## 🎯 URLs des Endpoints

### Format général

```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/[NOM-FONCTION]
```

### Trouver votre PROJECT-ID

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. L'URL de votre dashboard est : `https://supabase.com/dashboard/project/[PROJECT-ID]`
4. OU allez dans Settings > API > Project URL

**Exemple** : Si votre Project URL est `https://abcdefghijklmnop.supabase.co`
Alors votre PROJECT-ID est `abcdefghijklmnop`

---

## 🔵 Configuration Webhook Stripe

### URL à utiliser

```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

### Paramètres de configuration Stripe Dashboard

Quand Stripe vous demande de configurer la destination, voici exactement quoi mettre :

#### 1. URL d'endpoint
```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

**Remplacez `[VOTRE-PROJECT-ID]`** par votre vrai Project ID !

**Exemple concret** :
```
https://abcdefghijklmnop.supabase.co/functions/v1/stripe-webhook
```

#### 2. Nom de la destination
```
belleya-stripe-webhook
```

OU

```
belleya-stripe-webhook-connect
```

(30 caractères maximum - vous êtes à la limite avec le deuxième)

#### 3. Description
```
Webhook Belleya - Gestion paiements et comptes Connect
```

(84 caractères - parfait pour la limite de 255)

#### 4. Événements à écouter

**Option 1 - Sélection manuelle** (recommandé) :
- ✅ `account.updated`
- ✅ `charge.refunded`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `payment_intent.canceled`

**Option 2 - Tous les événements** :
- ✅ Cochez "Select all events" (l'Edge Function filtrera)

#### 5. Événements de
```
Comptes connectés et v2
```

OU

```
Tous les événements de votre compte
```

**Important** : Choisissez "Comptes connectés" si disponible, sinon "Tous les événements"

#### 6. Style de charge utile
```
Léger (Light)
```

#### 7. Version de l'API
```
Sans version (Latest)
```

OU sélectionnez une version spécifique :
```
2023-10-16
```

---

## 🔴 Configuration Webhook PayPal

### URL à utiliser

```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/paypal-webhook
```

### Paramètres de configuration PayPal Developer Dashboard

#### 1. Webhook URL
```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/paypal-webhook
```

**Exemple concret** :
```
https://abcdefghijklmnop.supabase.co/functions/v1/paypal-webhook
```

#### 2. Event types (types d'événements)

**Catégorie Checkout** :
- ✅ `CHECKOUT.ORDER.APPROVED`
- ✅ `CHECKOUT.ORDER.COMPLETED`
- ✅ `CHECKOUT.ORDER.VOIDED`

**Catégorie Payment Capture** :
- ✅ `PAYMENT.CAPTURE.COMPLETED`
- ✅ `PAYMENT.CAPTURE.DENIED`
- ✅ `PAYMENT.CAPTURE.PENDING`
- ✅ `PAYMENT.CAPTURE.REFUNDED`
- ✅ `PAYMENT.CAPTURE.REVERSED`

**Catégorie Merchant** :
- ✅ `MERCHANT.ONBOARDING.COMPLETED`
- ✅ `MERCHANT.PARTNER-CONSENT.REVOKED`

---

## 📋 Checklist de Configuration

### ✅ Stripe

1. [ ] Compte Stripe créé
2. [ ] Clés API copiées (pk_test_... et sk_test_...)
3. [ ] Webhook créé avec l'URL correcte
4. [ ] Événements sélectionnés (minimum : payment_intent.succeeded, account.updated)
5. [ ] Webhook Secret copié (whsec_...)
6. [ ] Variables ajoutées dans Supabase Functions
7. [ ] Edge Function déployée
8. [ ] Test effectué avec "Send test webhook"

### ✅ PayPal

1. [ ] Compte PayPal Business créé
2. [ ] Application créée dans Developer Dashboard
3. [ ] Client ID et Secret copiés
4. [ ] Webhook créé avec l'URL correcte
5. [ ] Événements sélectionnés
6. [ ] Webhook ID copié
7. [ ] Variables ajoutées dans Supabase Functions
8. [ ] Edge Function déployée
9. [ ] Test effectué

---

## 🧪 Tester vos Webhooks

### Test Stripe

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur votre webhook
3. Onglet "Test webhook"
4. Sélectionnez `payment_intent.succeeded`
5. Cliquez "Send test webhook"
6. Vérifiez dans Supabase que le log apparaît dans `payment_webhooks_log`

**SQL pour vérifier** :
```sql
SELECT * FROM payment_webhooks_log
WHERE provider = 'stripe'
ORDER BY created_at DESC
LIMIT 5;
```

### Test PayPal

1. Allez sur https://developer.paypal.com/dashboard/webhooks
2. Cliquez sur votre webhook
3. Section "Webhook simulator"
4. Sélectionnez `PAYMENT.CAPTURE.COMPLETED`
5. Cliquez "Send"
6. Vérifiez dans Supabase

**SQL pour vérifier** :
```sql
SELECT * FROM payment_webhooks_log
WHERE provider = 'paypal'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔐 Variables d'Environnement

### Où les ajouter

**Supabase Dashboard** :
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Settings > Edge Functions
4. Section "Secrets" ou "Environment Variables"
5. Add new variable

### Stripe (Mode Test)

```bash
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Stripe (Mode Live)

```bash
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLIC_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### PayPal (Mode Sandbox)

```bash
PAYPAL_CLIENT_ID=AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYPAL_CLIENT_SECRET=EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYPAL_PARTNER_ID=
PAYPAL_WEBHOOK_ID=WH-XXXXXXXXXXXXXXXX
PAYPAL_MODE=sandbox
```

### PayPal (Mode Live)

```bash
PAYPAL_CLIENT_ID=AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYPAL_CLIENT_SECRET=EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYPAL_PARTNER_ID=VOTRE_PARTNER_ID
PAYPAL_WEBHOOK_ID=WH-XXXXXXXXXXXXXXXX
PAYPAL_MODE=live
```

### Frontend (.env local)

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX
```

**En production** :
```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🚨 Erreurs Courantes

### Erreur 404 sur le webhook

**Cause** : Edge Function pas déployée ou URL incorrecte

**Solution** :
1. Vérifiez que l'URL est exacte (pas d'espaces, pas de typo)
2. Vérifiez que l'Edge Function est déployée
3. Testez l'URL directement dans le navigateur (devrait renvoyer une erreur mais pas 404)

### Erreur 401 Unauthorized

**Cause** : Signature webhook invalide

**Solution** :
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` ou `PAYPAL_WEBHOOK_ID` est correct
2. Vérifiez qu'il n'y a pas d'espaces avant/après dans les variables
3. Redéployez l'Edge Function après modification des variables

### Webhook reçu mais pas traité

**Cause** : Erreur dans le code de traitement

**Solution** :
1. Consultez les logs Supabase Functions
2. Vérifiez la table `payment_webhooks_log` pour voir les erreurs
3. Vérifiez que les tables `booking_payments` et `bookings` existent

---

## 📞 Aide Rapide

### Stripe Dashboard
- Webhooks : https://dashboard.stripe.com/webhooks
- API Keys : https://dashboard.stripe.com/apikeys
- Connect : https://dashboard.stripe.com/connect/accounts/overview
- Logs : https://dashboard.stripe.com/logs

### PayPal Developer
- Applications : https://developer.paypal.com/dashboard/applications
- Webhooks : https://developer.paypal.com/dashboard/webhooks
- Sandbox Accounts : https://developer.paypal.com/dashboard/accounts

### Supabase
- Functions : Dashboard > Edge Functions
- Logs : Dashboard > Edge Functions > [Fonction] > Logs
- Database : Dashboard > Table Editor

---

**Dernière mise à jour** : 1er février 2026
