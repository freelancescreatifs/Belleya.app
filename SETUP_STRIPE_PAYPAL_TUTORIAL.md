# Guide de Configuration Stripe Connect et PayPal pour Belleya

## 📋 Prérequis

Avant de commencer, vous aurez besoin de :
- Un compte Stripe (ou créer un nouveau)
- Un compte PayPal Business (ou créer un nouveau)
- L'URL de votre projet Supabase

## 🔍 Étape 0 : Identifier votre URL Supabase

Votre URL Supabase se trouve dans :
- Dashboard Supabase > Settings > API
- Format : `https://[VOTRE-PROJECT-ID].supabase.co`

**Important** : Notez cette URL, vous en aurez besoin pour les webhooks.

---

# 🔵 PARTIE 1 : Configuration Stripe Connect

## Étape 1 : Créer un compte Stripe (si vous n'en avez pas)

1. Allez sur https://dashboard.stripe.com/register
2. Créez votre compte Stripe
3. Vérifiez votre email
4. Complétez les informations de votre entreprise

## Étape 2 : Obtenir les clés API Stripe

### Mode Test (pour développement)

1. Allez sur https://dashboard.stripe.com/test/apikeys
2. Copiez :
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (commence par `sk_test_...`) - cliquez sur "Reveal test key"

### Mode Live (pour production)

1. Basculez en mode Live en haut à gauche du dashboard
2. Allez sur https://dashboard.stripe.com/apikeys
3. Copiez :
   - **Publishable key** (commence par `pk_live_...`)
   - **Secret key** (commence par `sk_live_...`) - cliquez sur "Reveal live key"

## Étape 3 : Activer Stripe Connect

1. Allez sur https://dashboard.stripe.com/connect/accounts/overview
2. Cliquez sur "Get started" si c'est votre première fois
3. Choisissez "Express" ou "Custom" (Express recommandé)
4. Acceptez les conditions de Stripe Connect

## Étape 4 : Configurer le Webhook Stripe

### URL du webhook à utiliser

```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

**Exemple** : Si votre projet Supabase est `abcdefghijklmnop`, l'URL sera :
```
https://abcdefghijklmnop.supabase.co/functions/v1/stripe-webhook
```

### Configuration dans Stripe Dashboard

1. **Allez sur** : https://dashboard.stripe.com/webhooks

2. **Cliquez sur** : "+ Add endpoint"

3. **Remplissez le formulaire** :

   **URL d'endpoint** :
   ```
   https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
   ```

   **Description** (facultatif) :
   ```
   Webhook Belleya - Gestion des paiements et statuts de comptes Connect
   ```

   **Nom de la destination** :
   ```
   belleya-stripe-webhook
   ```

4. **Section "Écouter"** - Sélectionnez ces événements :

   ✅ **Account** (Comptes connectés) :
   - `account.updated`

   ✅ **Charge** (Paiements) :
   - `charge.refunded`

   ✅ **Payment Intent** :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`

   **Astuce** : Vous pouvez aussi sélectionner "Receive all events" puis filtrer plus tard.

5. **Version de l'API** :
   - Laisser "Sans version" (latest) OU sélectionner `2023-10-16`

6. **Style de charge utile** :
   - Sélectionner "Léger" (Light)

7. **Cliquez sur** : "Add endpoint"

8. **Copiez le Webhook Secret** :
   - Après création, cliquez sur votre webhook
   - Section "Signing secret"
   - Cliquez sur "Click to reveal"
   - Copiez la clé (commence par `whsec_...`)

## Étape 5 : Ajouter les variables d'environnement dans Supabase

1. **Allez sur** : Dashboard Supabase > Settings > Functions (ou Edge Functions)

2. **Secrets / Environment Variables** - Ajoutez :

   **Mode Test** :
   ```bash
   STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
   STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_PUBLIQUE
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET
   ```

   **Mode Live** (quand vous êtes prêt pour la production) :
   ```bash
   STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE
   STRIPE_PUBLIC_KEY=pk_live_VOTRE_CLE_PUBLIQUE
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET
   ```

3. **Important** : Redéployez vos Edge Functions après modification des variables

## Étape 6 : Ajouter la clé publique Stripe dans votre frontend

Dans votre fichier `.env` (à la racine du projet) :

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_PUBLIQUE
```

**En production** :
```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_VOTRE_CLE_PUBLIQUE
```

## Étape 7 : Tester la connexion Stripe

1. Connectez-vous à Belleya en tant que prestataire
2. Allez dans "Paramètres" > "Profil public"
3. Activez "Demander un acompte"
4. Section "Paiement en ligne" apparaît
5. Cliquez sur "Connecter Stripe"
6. Vous serez redirigé vers Stripe
7. Complétez l'onboarding (en mode test, vous pouvez utiliser des données fictives)
8. Revenez sur Belleya
9. Statut devrait afficher "Connecté et actif"

### Données de test Stripe

**Compte Test** :
- Email : test@example.com
- Téléphone : +33600000000
- Adresse : 123 rue Test, Paris, 75001, France
- IBAN : FR1420041010050500013M02606 (IBAN de test)

**Carte de test** (pour paiements) :
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future (ex: 12/30)
- CVC : n'importe quel 3 chiffres (ex: 123)
- Code postal : n'importe lequel (ex: 75001)

---

# 🔴 PARTIE 2 : Configuration PayPal

## Étape 1 : Créer un compte PayPal Business

1. Allez sur https://www.paypal.com/fr/business
2. Cliquez sur "Ouvrir un compte"
3. Choisissez "Compte Business"
4. Complétez l'inscription
5. Vérifiez votre email et téléphone

## Étape 2 : Créer une application PayPal Developer

### Mode Sandbox (Test)

1. **Allez sur** : https://developer.paypal.com/dashboard/applications

2. **Connectez-vous** avec votre compte PayPal

3. **Passez en mode Sandbox** (en haut à gauche)

4. **Cliquez sur** : "Create App"

5. **Remplissez** :
   - App Name : `Belleya Sandbox`
   - App Type : `Merchant`

6. **Cliquez sur** : "Create App"

7. **Copiez les informations** :
   - **Client ID** (commence par `A...`)
   - **Secret** (cliquez sur "Show" puis copiez)

### Mode Live (Production)

1. **Basculez en mode Live** (en haut à gauche)

2. **Cliquez sur** : "Create App"

3. **Remplissez** :
   - App Name : `Belleya Production`
   - App Type : `Merchant`

4. **Activez les features nécessaires** :
   - ✅ Accept payments
   - ✅ Partner Fee
   - ✅ Advanced Checkout

5. **Copiez** :
   - **Client ID**
   - **Secret**

## Étape 3 : S'inscrire au programme PayPal Partner (Production uniquement)

**Important** : Pour utiliser PayPal Partner Referrals en production, vous devez être Partner.

1. **Allez sur** : https://www.paypal.com/us/webapps/mpp/partner-program

2. **Postulez** au programme Partner

3. **Attendez l'approbation** (peut prendre quelques jours)

4. **Une fois approuvé**, récupérez votre **Partner ID** dans le dashboard

**En attendant**, vous pouvez utiliser le mode Sandbox qui ne nécessite pas d'être Partner.

## Étape 4 : Configurer le Webhook PayPal

### URL du webhook à utiliser

```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/paypal-webhook
```

### Configuration dans PayPal Developer Dashboard

1. **Allez sur** : https://developer.paypal.com/dashboard/webhooks

2. **Passez en Sandbox ou Live** selon votre mode

3. **Cliquez sur** : "Add Webhook"

4. **Remplissez** :

   **Webhook URL** :
   ```
   https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/paypal-webhook
   ```

5. **Event types** - Sélectionnez :

   ✅ **Checkout** :
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.COMPLETED`
   - `CHECKOUT.ORDER.VOIDED`

   ✅ **Payment Capture** :
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.PENDING`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `PAYMENT.CAPTURE.REVERSED`

   ✅ **Merchant Onboarding** :
   - `MERCHANT.ONBOARDING.COMPLETED`
   - `MERCHANT.PARTNER-CONSENT.REVOKED`

6. **Cliquez sur** : "Save"

7. **Copiez le Webhook ID** :
   - Cliquez sur votre webhook créé
   - Copiez l'ID (format : `WH-XXXXXXXXXXXX`)

## Étape 5 : Ajouter les variables d'environnement PayPal dans Supabase

1. **Allez sur** : Dashboard Supabase > Settings > Functions

2. **Ajoutez** :

   **Mode Sandbox** :
   ```bash
   PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID_SANDBOX
   PAYPAL_CLIENT_SECRET=VOTRE_SECRET_SANDBOX
   PAYPAL_PARTNER_ID=VOTRE_PARTNER_ID (ou laissez vide pour sandbox)
   PAYPAL_WEBHOOK_ID=VOTRE_WEBHOOK_ID_SANDBOX
   PAYPAL_MODE=sandbox
   ```

   **Mode Live** :
   ```bash
   PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID_LIVE
   PAYPAL_CLIENT_SECRET=VOTRE_SECRET_LIVE
   PAYPAL_PARTNER_ID=VOTRE_PARTNER_ID
   PAYPAL_WEBHOOK_ID=VOTRE_WEBHOOK_ID_LIVE
   PAYPAL_MODE=live
   ```

## Étape 6 : Tester la connexion PayPal

1. Connectez-vous à Belleya en tant que prestataire
2. Allez dans "Paramètres" > "Profil public"
3. Section "Paiement en ligne"
4. Cliquez sur "Connecter PayPal"
5. Vous serez redirigé vers PayPal
6. Connectez-vous avec votre compte PayPal Sandbox
7. Autorisez l'application
8. Revenez sur Belleya
9. Statut devrait afficher "Connecté et actif"

### Comptes de test PayPal Sandbox

PayPal crée automatiquement des comptes de test. Pour les voir :

1. **Allez sur** : https://developer.paypal.com/dashboard/accounts
2. **Mode Sandbox**
3. Vous verrez des comptes "Personal" et "Business" de test
4. Utilisez-les pour tester les paiements

---

# 🧪 PARTIE 3 : Tester le système de paiement

## Test 1 : Connexion Prestataire

### Avec Stripe

1. ✅ Allez dans "Profil public"
2. ✅ Activez "Demander un acompte"
3. ✅ Montant : 20€
4. ✅ Cliquez "Connecter Stripe"
5. ✅ Complétez l'onboarding Stripe Express
6. ✅ Revenez sur Belleya
7. ✅ Vérifiez que le statut est "Connecté et actif"

### Avec PayPal

1. ✅ Cliquez "Connecter PayPal"
2. ✅ Connectez-vous avec votre compte PayPal
3. ✅ Autorisez l'application
4. ✅ Revenez sur Belleya
5. ✅ Vérifiez que le statut est "Connecté et actif"

## Test 2 : Paiement d'acompte (Cliente)

### Avec Stripe

1. ✅ Ouvrez le lien de réservation public d'un prestataire
2. ✅ Sélectionnez un service et un créneau
3. ✅ Remplissez les informations
4. ✅ Page de paiement s'affiche
5. ✅ Sélectionnez "Carte bancaire"
6. ✅ Entrez les coordonnées de carte de test : `4242 4242 4242 4242`
7. ✅ Validez le paiement
8. ✅ Vérifiez que la réservation est confirmée

### Avec PayPal

1. ✅ Même processus que Stripe
2. ✅ Sélectionnez "PayPal"
3. ✅ Redirigé vers PayPal
4. ✅ Connectez-vous avec un compte test
5. ✅ Approuvez le paiement
6. ✅ Redirigé vers Belleya
7. ✅ Vérifiez que la réservation est confirmée

## Test 3 : Vérifier les webhooks

### Dans Stripe Dashboard

1. **Allez sur** : https://dashboard.stripe.com/webhooks
2. Cliquez sur votre webhook
3. Onglet "Events"
4. Vous devriez voir les événements reçus
5. Vérifiez que le statut est "Succeeded"

### Dans PayPal Developer Dashboard

1. **Allez sur** : https://developer.paypal.com/dashboard/webhooks
2. Cliquez sur votre webhook
3. Section "Events"
4. Vous devriez voir les événements reçus

### Dans Supabase

Vérifiez la table `payment_webhooks_log` :

```sql
SELECT * FROM payment_webhooks_log
ORDER BY created_at DESC
LIMIT 10;
```

Tous les webhooks devraient avoir `processed = true`.

---

# 🔐 PARTIE 4 : Passer en Production

## Checklist avant mise en production

### Stripe

- [ ] Compte Stripe vérifié et activé
- [ ] Basculer en mode Live
- [ ] Copier les clés Live (pk_live_... et sk_live_...)
- [ ] Créer un nouveau webhook en mode Live
- [ ] Copier le Webhook Secret Live
- [ ] Mettre à jour les variables d'environnement Supabase
- [ ] Mettre à jour VITE_STRIPE_PUBLIC_KEY en production
- [ ] Tester avec une vraie carte (petite transaction)

### PayPal

- [ ] Compte PayPal Business vérifié
- [ ] Inscrit au programme Partner (ou alternative)
- [ ] Application en mode Live créée
- [ ] Webhook Live configuré
- [ ] Variables d'environnement mises à jour
- [ ] PAYPAL_MODE=live
- [ ] Tester avec un vrai compte PayPal

---

# 📊 PARTIE 5 : Monitoring et Suivi

## Dashboard Stripe

Accédez à vos statistiques :
- https://dashboard.stripe.com/payments

Vous verrez :
- Tous les paiements
- Montant total
- Commission plateforme (5%)
- Statut des virements aux prestataires

## Dashboard PayPal

Accédez à vos transactions :
- https://www.paypal.com/activity

Vous verrez :
- Toutes les transactions
- Montant reçu
- Commission plateforme (5%)

## Dans Belleya (base de données)

### Voir tous les paiements

```sql
SELECT
  bp.*,
  b.client_name,
  b.service_name,
  cp.company_name
FROM booking_payments bp
JOIN bookings b ON bp.booking_id = b.id
JOIN company_profiles cp ON bp.company_id = cp.id
ORDER BY bp.created_at DESC;
```

### Statistiques par prestataire

```sql
SELECT
  cp.company_name,
  COUNT(*) as total_paiements,
  SUM(bp.amount) as montant_total,
  SUM(CASE WHEN bp.status = 'paid' THEN bp.amount ELSE 0 END) as montant_paye
FROM booking_payments bp
JOIN company_profiles cp ON bp.company_id = cp.id
GROUP BY cp.id, cp.company_name;
```

---

# ❓ FAQ et Dépannage

## Stripe ne redirige pas après onboarding

**Problème** : Bloqué sur la page Stripe après onboarding.

**Solution** :
1. Vérifiez que l'URL de retour est correcte dans le code
2. Vérifiez que votre domaine est autorisé dans Stripe Dashboard
3. Essayez de rafraîchir le statut manuellement

## PayPal : "Partner ID not configured"

**Problème** : Erreur lors de la création du referral.

**Solution** :
1. En Sandbox, vous pouvez laisser `PAYPAL_PARTNER_ID` vide
2. En Live, vous devez être inscrit au programme Partner
3. Alternative : utilisez uniquement Stripe en attendant l'approbation

## Webhook non reçu

**Problème** : Les paiements ne se confirment pas automatiquement.

**Solution** :
1. Vérifiez l'URL du webhook (pas de typo)
2. Vérifiez que l'Edge Function est déployée
3. Consultez les logs Supabase Functions
4. Testez manuellement le webhook avec "Send test webhook"

## Statut reste "pending"

**Problème** : Après onboarding, le statut reste "pending".

**Solution** :
1. Cliquez sur le bouton de rafraîchissement
2. Attendez quelques minutes (webhooks peuvent être lents)
3. Vérifiez que l'onboarding est vraiment complet

---

# 📞 Support

## Stripe

- Documentation : https://stripe.com/docs/connect
- Support : https://support.stripe.com

## PayPal

- Documentation : https://developer.paypal.com/docs/
- Support : https://www.paypal.com/businessmanage/support

## Belleya

- Guide complet : `PAYMENT_SYSTEM_GUIDE.md`
- Résumé technique : `PAYMENT_IMPLEMENTATION_SUMMARY.md`

---

**Date de création** : 1er février 2026
**Dernière mise à jour** : 1er février 2026
**Version** : 1.0
