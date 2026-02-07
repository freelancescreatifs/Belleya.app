# Configuration EXACTE du Webhook Stripe

## 📍 Vous êtes sur cette page : "Configurer la destination"

Voici EXACTEMENT ce qu'il faut remplir dans chaque champ.

---

## 1️⃣ URL d'endpoint

**Ce champ dit** : "Une URL est nécessaire pour recevoir les événements envoyés par les webhooks."

### Votre réponse EXACTE :

```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

### Comment trouver votre PROJECT-ID

1. **Option A** - Depuis l'URL de votre dashboard Supabase :
   - Vous êtes sur : `https://supabase.com/dashboard/project/abcdefghijklmnop`
   - Votre PROJECT-ID est : `abcdefghijklmnop`

2. **Option B** - Depuis Settings > API :
   - Allez dans Settings > API
   - Cherchez "Project URL"
   - Vous verrez : `https://abcdefghijklmnop.supabase.co`
   - Votre PROJECT-ID est : `abcdefghijklmnop`

### Exemple concret complet

Si votre Project URL Supabase est :
```
https://xyzabcdef123456.supabase.co
```

Alors votre URL de webhook Stripe sera :
```
https://xyzabcdef123456.supabase.co/functions/v1/stripe-webhook
```

### ⚠️ Erreurs à éviter

❌ **NE PAS mettre** :
- `https://supabase.co/functions/v1/stripe-webhook` (manque le Project ID)
- `https://[PROJECT-ID].supabase.co/stripe-webhook` (manque `/functions/v1/`)
- `https://monprojet.supabase.co/functions/v1/stripe-webhook` (si ce n'est pas votre vrai ID)

✅ **Format correct** :
- `https://` au début
- Votre vrai Project ID (ex: `abcdefghijklmnop`)
- `.supabase.co`
- `/functions/v1/stripe-webhook` à la fin

---

## 2️⃣ Nom de la destination

**Ce champ dit** : "30/100 caractères" et vous avez pré-rempli "belleya-stripe-webhook-connect"

### Votre réponse :

Vous pouvez laisser ce que vous avez mis :
```
belleya-stripe-webhook-connect
```

**Longueur** : 31 caractères (c'est bon, maximum 100)

### Alternatives (si vous préférez un nom plus court) :

```
belleya-webhook
```

OU

```
belleya-payments
```

OU

```
belleya-stripe
```

**Mon conseil** : Gardez `belleya-stripe-webhook-connect`, c'est clair et descriptif.

---

## 3️⃣ Description

**Ce champ dit** : "84/255 caractères"

### Votre réponse EXACTE :

```
Webhook Belleya - Gestion des paiements et statuts de comptes Connect
```

**Longueur** : 71 caractères (parfait, sous la limite de 255)

### Alternatives :

**Option courte** :
```
Gestion paiements Belleya
```

**Option détaillée** :
```
Webhook pour recevoir les événements de paiement (payment_intent) et de mise à jour des comptes Connect (account.updated) pour la plateforme Belleya
```

**Mon conseil** : Utilisez la version que j'ai donnée en premier, elle est claire et professionnelle.

---

## 4️⃣ Événements de

**Ce champ dit** : "Comptes connectés et v2"

### Votre choix :

✅ **Sélectionnez** : "Comptes connectés et v2"

**Pourquoi ?** Parce que vous utilisez Stripe Connect (comptes Express pour vos prestataires).

### Si cette option n'est pas disponible :

Sélectionnez :
```
Tous les événements de votre compte
```

---

## 5️⃣ Style de charge utile

**Ce champ dit** : "Léger"

### Votre choix :

✅ **Sélectionnez** : "Léger" (Light)

**Pourquoi ?** C'est le format standard et le plus simple à traiter.

---

## 6️⃣ Version de l'API

**Ce champ dit** : "Sans version"

### Votre choix :

Vous avez **2 options** :

**Option 1** (recommandée pour débuter) :
```
Sans version (Latest)
```

**Option 2** (recommandée pour production) :
```
2023-10-16
```

**Mon conseil** : Choisissez "Sans version" pour l'instant. Vous pourrez toujours changer plus tard.

---

## 7️⃣ Écoute (Événements à sélectionner)

**Ce champ dit** : "15 événements"

Vous devez sélectionner les événements que votre webhook va écouter.

### Événements OBLIGATOIRES (minimum) :

Dans la liste, recherchez et cochez :

✅ **account.updated**
- Catégorie : Account
- Description : Occurs whenever an account status or property has changed

✅ **payment_intent.succeeded**
- Catégorie : Payment Intent
- Description : Occurs when a PaymentIntent has succeeded

✅ **payment_intent.payment_failed**
- Catégorie : Payment Intent
- Description : Occurs when a PaymentIntent has failed

✅ **charge.refunded**
- Catégorie : Charge
- Description : Occurs whenever a charge is refunded

### Événements RECOMMANDÉS (en plus) :

✅ **payment_intent.canceled**
- Pour gérer les annulations

✅ **payment_intent.created**
- Pour suivre les créations de paiements

### Option FACILE :

Si vous ne trouvez pas ces événements ou si c'est trop compliqué :

✅ **Cochez** : "Select all events" (Tous les événements)

**Avantage** : Vous ne raterez aucun événement
**Inconvénient** : Vous recevrez plus de webhooks que nécessaire (mais ce n'est pas grave)

---

## 📋 Résumé de VOTRE configuration

Voici ce que vous devez avoir rempli :

```
┌─────────────────────────────────────────────────────────────┐
│ Configurer la destination                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Événements de:                                                │
│ ○ Comptes connectés et v2          ← SÉLECTIONNÉ            │
│ ○ Tous les événements de votre compte                        │
│                                                               │
│ Style de charge utile:                                        │
│ ○ Léger                            ← SÉLECTIONNÉ            │
│ ○ Complet                                                     │
│                                                               │
│ Version de l'API:                                             │
│ ○ Sans version                     ← SÉLECTIONNÉ            │
│ ○ 2023-10-16                                                  │
│                                                               │
│ Écoute:                                                       │
│ ☑ account.updated                  ← COCHÉ                   │
│ ☑ payment_intent.succeeded         ← COCHÉ                   │
│ ☑ payment_intent.payment_failed    ← COCHÉ                   │
│ ☑ charge.refunded                  ← COCHÉ                   │
│                                                               │
│ Nom de la destination:                                        │
│ [belleya-stripe-webhook-connect]                             │
│                                                               │
│ URL d'endpoint:                                               │
│ [https://abcdefghijklmnop.supabase.co/functions/v1/stripe-   │
│  webhook]                                                     │
│                                                               │
│ Description:                                                  │
│ [Webhook Belleya - Gestion des paiements et statuts de      │
│  comptes Connect]                                             │
│                                                               │
│ [Ajouter une destination]          ← CLIQUER ICI            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Après avoir cliqué sur "Ajouter une destination"

### Vous verrez une page avec :

1. **Votre webhook créé** avec un statut "Active"

2. **Signing secret** (très important !) :
   - Cliquez sur "Click to reveal"
   - Copiez la clé qui commence par `whsec_...`
   - **Gardez-la précieusement** !

### IMPORTANT : Copiez le Webhook Secret

```
whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Vous devrez l'ajouter dans vos variables d'environnement Supabase :

**Supabase Dashboard** > **Settings** > **Edge Functions** > **Secrets**

Nom de la variable :
```
STRIPE_WEBHOOK_SECRET
```

Valeur :
```
whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## ✅ Vérifier que tout fonctionne

### Test 1 : Envoyer un webhook de test

1. Sur la page de votre webhook dans Stripe
2. Onglet "Test webhook"
3. Sélectionnez `payment_intent.succeeded`
4. Cliquez "Send test webhook"
5. Vous devriez voir "Succeeded" en vert

### Test 2 : Vérifier dans Supabase

Connectez-vous à votre base de données et exécutez :

```sql
SELECT * FROM payment_webhooks_log
WHERE provider = 'stripe'
ORDER BY created_at DESC
LIMIT 1;
```

Vous devriez voir une ligne avec :
- `provider = 'stripe'`
- `event_type = 'payment_intent.succeeded'`
- `processed = true`

### Test 3 : Consulter les logs Edge Functions

1. **Supabase Dashboard** > **Edge Functions**
2. Cliquez sur `stripe-webhook`
3. Onglet "Logs"
4. Vous devriez voir des logs de réception du webhook

---

## 🆘 En cas d'erreur

### Erreur : "Unable to connect to webhook endpoint"

**Cause** : L'URL est incorrecte ou l'Edge Function n'est pas déployée

**Solution** :
1. Vérifiez que l'URL est exactement comme indiqué
2. Vérifiez que votre Edge Function `stripe-webhook` est déployée
3. Essayez d'ouvrir l'URL dans un navigateur (devrait renvoyer une erreur, pas 404)

### Erreur : "Webhook signature verification failed"

**Cause** : Le Webhook Secret est incorrect

**Solution** :
1. Re-copiez le Webhook Secret depuis Stripe Dashboard
2. Vérifiez qu'il n'y a pas d'espaces avant/après
3. Mettez à jour la variable dans Supabase
4. Redéployez l'Edge Function

### Erreur : Le webhook est reçu mais rien ne se passe

**Cause** : Erreur dans le traitement du webhook

**Solution** :
1. Consultez les logs de l'Edge Function
2. Vérifiez la table `payment_webhooks_log` pour voir l'erreur
3. Vérifiez que les tables existent (booking_payments, bookings)

---

## 📞 Besoin d'aide ?

Consultez les guides complets :
- `SETUP_STRIPE_PAYPAL_TUTORIAL.md` : Guide pas à pas complet
- `WEBHOOK_ENDPOINTS_REFERENCE.md` : Référence rapide des URLs
- `PAYMENT_SYSTEM_GUIDE.md` : Documentation technique complète

---

**Créé le** : 1er février 2026
**Pour** : Configuration webhook Stripe sur Belleya
