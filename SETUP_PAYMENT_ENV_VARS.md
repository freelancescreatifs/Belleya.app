# Configuration des Variables d'Environnement pour les Paiements

Les erreurs "Failed to connect Stripe" et "Failed to connect PayPal" viennent du fait que les clés API ne sont pas configurées dans Supabase.

## Étape 1 : Accéder aux Variables d'Environnement Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **lldznuayrxzvliehywoc**
3. Dans le menu de gauche, cliquez sur **Project Settings** (icône engrenage)
4. Cliquez sur **Edge Functions** dans le menu
5. Faites défiler jusqu'à la section **Secrets**

## Étape 2 : Configurer les Variables pour STRIPE

Vous devez ajouter ces variables :

### STRIPE_SECRET_KEY

1. Créez un compte Stripe sur https://dashboard.stripe.com/register
2. Une fois connecté, allez sur https://dashboard.stripe.com/apikeys
3. Copiez votre **Secret key** (commence par `sk_test_` en mode test ou `sk_live_` en production)
4. Dans Supabase, cliquez sur **Add new secret**
   - Nom : `STRIPE_SECRET_KEY`
   - Valeur : collez votre clé secrète Stripe
   - Cliquez sur **Save**

## Étape 3 : Configurer les Variables pour PAYPAL

### PAYPAL_CLIENT_ID

1. Créez un compte PayPal Developer sur https://developer.paypal.com
2. Connectez-vous à https://developer.paypal.com/dashboard/
3. Cliquez sur **Apps & Credentials**
4. Créez une nouvelle app (ou utilisez une existante)
5. Copiez le **Client ID**
6. Dans Supabase, ajoutez :
   - Nom : `PAYPAL_CLIENT_ID`
   - Valeur : collez votre Client ID PayPal

### PAYPAL_CLIENT_SECRET

1. Sur la même page dans PayPal Dashboard
2. Cliquez sur **Show** sous **Secret**
3. Copiez le secret
4. Dans Supabase, ajoutez :
   - Nom : `PAYPAL_CLIENT_SECRET`
   - Valeur : collez votre Client Secret PayPal

### PAYPAL_MODE

1. Dans Supabase, ajoutez :
   - Nom : `PAYPAL_MODE`
   - Valeur : `sandbox` (pour les tests) ou `live` (pour la production)

### PAYPAL_PARTNER_ID (Optionnel pour l'instant)

1. Dans Supabase, ajoutez :
   - Nom : `PAYPAL_PARTNER_ID`
   - Valeur : laissez vide pour l'instant, ou utilisez votre Partner ID si vous en avez un

## Étape 4 : Vérifier la Configuration

Une fois toutes les variables ajoutées, vous devriez avoir :

- ✅ `STRIPE_SECRET_KEY`
- ✅ `PAYPAL_CLIENT_ID`
- ✅ `PAYPAL_CLIENT_SECRET`
- ✅ `PAYPAL_MODE`
- ✅ `PAYPAL_PARTNER_ID` (optionnel)

## Étape 5 : Tester

1. Allez dans **Paramètres** > **Profil Public**
2. Faites défiler jusqu'à "Paramètres de réservation"
3. Activez "Acompte requis"
4. Essayez de cliquer sur **Connecter Stripe** ou **Connecter PayPal**
5. Vous devriez être redirigé vers les pages d'onboarding

## Mode Test vs Production

### Pour STRIPE

- **Mode Test** : Utilisez les clés qui commencent par `sk_test_`
- **Mode Production** : Utilisez les clés qui commencent par `sk_live_`
- Vous pouvez basculer entre les deux dans votre Dashboard Stripe (bouton en haut à droite)

### Pour PAYPAL

- **Mode Test (Sandbox)** : `PAYPAL_MODE=sandbox` + utilisez les clés de l'app Sandbox
- **Mode Production (Live)** : `PAYPAL_MODE=live` + utilisez les clés de l'app Live

## IMPORTANT : Sécurité

- ⚠️ **NE JAMAIS** committer ces clés dans Git
- ⚠️ **NE JAMAIS** partager vos clés secrètes
- ⚠️ Les clés Supabase sont déjà protégées (elles sont dans Supabase, pas dans votre code)
- ✅ Vous pouvez basculer en mode test pour développer sans risque

## Résolution des Problèmes

Si vous avez toujours des erreurs après configuration :

1. Vérifiez que toutes les variables sont bien enregistrées dans Supabase
2. Attendez 1-2 minutes que Supabase applique les changements
3. Essayez à nouveau de connecter Stripe ou PayPal
4. Vérifiez les logs dans Supabase : **Edge Functions** > Sélectionnez la fonction > **Logs**

## Commissions

### Stripe
- Frais Stripe : 1,5% + 0,25€ par transaction
- Commission plateforme : 5%
- Total prélevé : ~6,5% + 0,25€

### PayPal
- Frais PayPal : 2,9% + 0,35€ par transaction
- Commission plateforme : 5%
- Total prélevé : ~7,9% + 0,35€
