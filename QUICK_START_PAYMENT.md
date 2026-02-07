# Quick Start - Activer les Paiements en 5 Minutes

## 🎯 Objectif

Activer Stripe ou PayPal pour recevoir des acomptes en ligne sur Belleya.

---

## ⚡ Option 1 : Stripe (RECOMMANDÉ - Plus simple)

### Étape 1 : Créer un compte Stripe (2 min)

1. Allez sur https://dashboard.stripe.com/register
2. Créez votre compte
3. Vérifiez votre email

### Étape 2 : Copier les clés API (1 min)

1. Allez sur https://dashboard.stripe.com/test/apikeys
2. Copiez :
   - **Publishable key** : `pk_test_...`
   - **Secret key** : `sk_test_...` (cliquez sur "Reveal")

### Étape 3 : Créer le webhook (1 min)

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez "+ Add endpoint"
3. **URL** : `https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`
   - Remplacez `[VOTRE-PROJECT-ID]` par votre vrai ID Supabase
4. **Événements** : Cochez "Select all events"
5. Cliquez "Add endpoint"
6. Copiez le **Webhook secret** : `whsec_...`

### Étape 4 : Ajouter les clés dans Supabase (1 min)

1. **Supabase Dashboard** > **Settings** > **Edge Functions** > **Secrets**
2. Ajoutez :
   ```
   STRIPE_SECRET_KEY = sk_test_...
   STRIPE_PUBLIC_KEY = pk_test_...
   STRIPE_WEBHOOK_SECRET = whsec_...
   ```

3. **Dans votre fichier `.env` local** :
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```

### Étape 5 : Tester sur Belleya (30 sec)

1. Connectez-vous en tant que prestataire
2. **Paramètres** > **Profil public**
3. Activez "Demander un acompte"
4. Cliquez "Connecter Stripe"
5. Complétez l'onboarding (données de test OK)
6. ✅ Statut "Connecté et actif"

### ✅ C'est fait ! Vous pouvez recevoir des paiements.

**Carte de test** pour vos tests :
- Numéro : `4242 4242 4242 4242`
- Date : `12/30`
- CVC : `123`

---

## ⚡ Option 2 : PayPal

### Étape 1 : Créer un compte PayPal Business (3 min)

1. Allez sur https://www.paypal.com/fr/business
2. Créez un compte Business
3. Vérifiez votre email

### Étape 2 : Créer une application Developer (2 min)

1. Allez sur https://developer.paypal.com/dashboard/applications
2. Connectez-vous
3. **Mode Sandbox** (en haut à gauche)
4. Cliquez "Create App"
5. Nom : "Belleya Sandbox"
6. Type : "Merchant"
7. Copiez :
   - **Client ID** : `A...`
   - **Secret** : cliquez "Show" puis copiez

### Étape 3 : Créer le webhook (1 min)

1. Allez sur https://developer.paypal.com/dashboard/webhooks
2. Cliquez "Add Webhook"
3. **URL** : `https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/paypal-webhook`
4. **Events** : Cochez "All events" (ou sélectionnez manuellement)
5. Cliquez "Save"
6. Copiez le **Webhook ID** : `WH-...`

### Étape 4 : Ajouter les clés dans Supabase (1 min)

1. **Supabase Dashboard** > **Settings** > **Edge Functions** > **Secrets**
2. Ajoutez :
   ```
   PAYPAL_CLIENT_ID = A...
   PAYPAL_CLIENT_SECRET = E...
   PAYPAL_WEBHOOK_ID = WH-...
   PAYPAL_MODE = sandbox
   ```

### Étape 5 : Tester sur Belleya (30 sec)

1. Connectez-vous en tant que prestataire
2. **Paramètres** > **Profil public**
3. Activez "Demander un acompte"
4. Cliquez "Connecter PayPal"
5. Connectez-vous avec votre compte PayPal
6. Autorisez l'application
7. ✅ Statut "Connecté et actif"

### ✅ C'est fait ! Vous pouvez recevoir des paiements.

**Comptes de test** : Disponibles dans https://developer.paypal.com/dashboard/accounts

---

## 📊 Comparaison Stripe vs PayPal

| Critère | Stripe | PayPal |
|---------|--------|--------|
| **Facilité** | ⭐⭐⭐⭐⭐ Très simple | ⭐⭐⭐ Moyen |
| **Frais** | 1,5% + 0,25€ | 2,9% + 0,35€ |
| **Délai réception** | J+2 | J+1 à J+3 |
| **Interface** | Très propre | Standard |
| **Support** | Excellent | Bon |
| **Cartes acceptées** | Toutes | Toutes |
| **Compte PayPal** | ❌ Non nécessaire | ✅ Nécessaire |

**Recommandation** : Commencez par **Stripe** (plus simple). Ajoutez PayPal plus tard si besoin.

---

## 🔄 Passer en Production

### Quand vous êtes prêt (après tests) :

#### Pour Stripe :

1. **Stripe Dashboard** : Basculez en mode "Live" (en haut à gauche)
2. Copiez les nouvelles clés Live : `pk_live_...` et `sk_live_...`
3. Créez un nouveau webhook en mode Live
4. Copiez le nouveau Webhook Secret Live
5. Mettez à jour les variables Supabase avec les clés Live
6. Mettez à jour `.env` avec `VITE_STRIPE_PUBLIC_KEY=pk_live_...`

#### Pour PayPal :

1. **PayPal Developer** : Basculez en mode "Live"
2. Créez une nouvelle application Live
3. Copiez les nouvelles clés Live
4. Créez un nouveau webhook Live
5. Changez `PAYPAL_MODE=live` dans Supabase

---

## 🆘 Problèmes courants

### "Unable to connect to webhook endpoint"

**Solution** :
- Vérifiez que votre PROJECT-ID Supabase est correct
- Vérifiez que l'Edge Function est déployée
- URL doit être : `https://[PROJECT-ID].supabase.co/functions/v1/[stripe ou paypal]-webhook`

### "Webhook signature verification failed"

**Solution** :
- Re-copiez le Webhook Secret
- Pas d'espaces avant/après
- Redéployez l'Edge Function après modification

### Statut reste "pending"

**Solution** :
- Attendez 1-2 minutes
- Cliquez sur le bouton de rafraîchissement
- Vérifiez que l'onboarding est complet

---

## 📞 Ressources

### Guides complets
- `SETUP_STRIPE_PAYPAL_TUTORIAL.md` : Guide détaillé étape par étape
- `STRIPE_WEBHOOK_CONFIG_EXACT.md` : Configuration exacte webhook Stripe
- `WEBHOOK_ENDPOINTS_REFERENCE.md` : Référence rapide des URLs
- `PAYMENT_SYSTEM_GUIDE.md` : Documentation technique complète

### Support officiel
- **Stripe** : https://support.stripe.com
- **PayPal** : https://www.paypal.com/businessmanage/support

---

## 🎉 C'est tout !

En moins de 10 minutes, vous pouvez commencer à recevoir des paiements en ligne sur Belleya.

**Prochaine étape** : Testez en créant une réservation de test et en payant avec une carte de test !

---

**Dernière mise à jour** : 1er février 2026
