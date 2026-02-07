# 📚 Index de la Documentation Paiement Belleya

Tous les guides pour configurer et utiliser le système de paiement en ligne avec Stripe et PayPal.

---

## 🚀 Guides Quick Start

### Pour démarrer rapidement (5-10 minutes)

**1. QUICK_START_PAYMENT.md** ⚡
- Configuration Stripe en 5 min
- Configuration PayPal en 7 min
- Comparaison Stripe vs PayPal
- Problèmes courants et solutions rapides
- **👉 Commencez par celui-ci si vous voulez juste faire fonctionner le système rapidement**

---

## 📖 Guides Détaillés

### Pour tout comprendre étape par étape

**2. SETUP_STRIPE_PAYPAL_TUTORIAL.md** 📘
- **PARTIE 1** : Configuration Stripe Connect (7 étapes détaillées)
- **PARTIE 2** : Configuration PayPal (6 étapes détaillées)
- **PARTIE 3** : Tests du système de paiement
- **PARTIE 4** : Passage en Production
- **PARTIE 5** : Monitoring et Suivi
- FAQ et Dépannage complet
- **👉 Le guide le plus complet, avec tous les détails**

**3. STRIPE_WEBHOOK_CONFIG_EXACT.md** 🎯
- Configuration EXACTE du webhook Stripe
- Réponses précises pour chaque champ du formulaire Stripe
- Comment trouver votre PROJECT-ID Supabase
- Schéma visuel de la configuration
- Vérification et tests
- **👉 Utilisez ce guide quand vous êtes sur la page "Configurer la destination" de Stripe**

---

## 📋 Références Rapides

### Pour retrouver rapidement une information

**4. WEBHOOK_ENDPOINTS_REFERENCE.md** 🔗
- URLs exactes des endpoints (Stripe et PayPal)
- Comment trouver votre PROJECT-ID
- Liste complète des événements à écouter
- Variables d'environnement (Stripe, PayPal, Frontend)
- Checklist de configuration
- Tests des webhooks
- **👉 Gardez ce fichier ouvert quand vous configurez les webhooks**

---

## 📚 Documentation Technique

### Pour les développeurs et l'architecture

**5. PAYMENT_SYSTEM_GUIDE.md** 🏗️
- Architecture complète du système
- Description des tables de base de données
- Description des 6 Edge Functions
- Description des composants Frontend
- Flux utilisateur détaillés (prestataire et cliente)
- Sécurité et RLS
- Frais et commissions (calculs détaillés)
- Remboursements
- Debugging
- Limites et améliorations futures
- **👉 Pour comprendre comment tout fonctionne en profondeur**

**6. PAYMENT_IMPLEMENTATION_SUMMARY.md** 📝
- Résumé de tout ce qui a été implémenté
- Liste des fichiers créés/modifiés
- Flux complet prestataire et cliente
- Prochaines étapes pour la production
- **👉 Pour avoir une vue d'ensemble rapide du projet**

---

## 🗺️ Quel guide utiliser selon votre situation ?

### Je veux juste activer les paiements le plus vite possible
👉 **QUICK_START_PAYMENT.md**

### Je suis en train de configurer le webhook Stripe et je suis perdu
👉 **STRIPE_WEBHOOK_CONFIG_EXACT.md**

### Je veux comprendre toutes les étapes en détail
👉 **SETUP_STRIPE_PAYPAL_TUTORIAL.md**

### J'ai besoin de retrouver une URL ou une variable d'environnement
👉 **WEBHOOK_ENDPOINTS_REFERENCE.md**

### Je suis développeur et je veux comprendre l'architecture
👉 **PAYMENT_SYSTEM_GUIDE.md**

### Je veux savoir ce qui a été fait exactement
👉 **PAYMENT_IMPLEMENTATION_SUMMARY.md**

---

## 📍 Liens Utiles Externes

### Stripe
- Dashboard : https://dashboard.stripe.com
- Webhooks : https://dashboard.stripe.com/webhooks
- API Keys : https://dashboard.stripe.com/apikeys
- Connect : https://dashboard.stripe.com/connect/accounts/overview
- Documentation : https://stripe.com/docs/connect
- Support : https://support.stripe.com

### PayPal
- Dashboard : https://www.paypal.com/activity
- Developer Dashboard : https://developer.paypal.com/dashboard
- Applications : https://developer.paypal.com/dashboard/applications
- Webhooks : https://developer.paypal.com/dashboard/webhooks
- Sandbox Accounts : https://developer.paypal.com/dashboard/accounts
- Documentation : https://developer.paypal.com/docs/
- Support : https://www.paypal.com/businessmanage/support

### Supabase
- Dashboard : https://supabase.com/dashboard
- Documentation : https://supabase.com/docs
- Edge Functions : https://supabase.com/docs/guides/functions

---

## 🔄 Ordre de lecture recommandé

### Pour une première configuration

1. **Lire** : `QUICK_START_PAYMENT.md` (5 min)
2. **Lire** : `WEBHOOK_ENDPOINTS_REFERENCE.md` (3 min)
3. **Suivre** : `SETUP_STRIPE_PAYPAL_TUTORIAL.md` - PARTIE 1 (Stripe) (15 min)
4. **Utiliser** : `STRIPE_WEBHOOK_CONFIG_EXACT.md` pendant la config (pendant)
5. **Tester** avec les données de test
6. **Si besoin** : Lire `PAYMENT_SYSTEM_GUIDE.md` pour comprendre le fonctionnement

### Pour passer en production

1. **Relire** : `SETUP_STRIPE_PAYPAL_TUTORIAL.md` - PARTIE 4 (Production)
2. **Vérifier** : `WEBHOOK_ENDPOINTS_REFERENCE.md` - Checklist
3. **Tester** avec de vraies petites transactions
4. **Activer** pour tous les utilisateurs

---

## ❓ FAQ Rapide

### Quelle est l'URL du webhook Stripe ?
```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```
👉 Voir `WEBHOOK_ENDPOINTS_REFERENCE.md`

### Quelle est l'URL du webhook PayPal ?
```
https://[VOTRE-PROJECT-ID].supabase.co/functions/v1/paypal-webhook
```
👉 Voir `WEBHOOK_ENDPOINTS_REFERENCE.md`

### Comment trouver mon PROJECT-ID Supabase ?
👉 Voir `STRIPE_WEBHOOK_CONFIG_EXACT.md` - Section 1

### Quels événements Stripe dois-je sélectionner ?
- `account.updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

👉 Voir `STRIPE_WEBHOOK_CONFIG_EXACT.md` - Section 7

### Quels événements PayPal dois-je sélectionner ?
- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.REFUNDED`
- `MERCHANT.ONBOARDING.COMPLETED`

👉 Voir `WEBHOOK_ENDPOINTS_REFERENCE.md`

### Quelles sont les variables d'environnement nécessaires ?
**Stripe** :
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`

**PayPal** :
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MODE`

👉 Voir `WEBHOOK_ENDPOINTS_REFERENCE.md` - Section Variables d'Environnement

### Comment tester le système ?
👉 Voir `SETUP_STRIPE_PAYPAL_TUTORIAL.md` - PARTIE 3

### Quel est le montant de la commission plateforme ?
**5%** sur chaque transaction (Stripe et PayPal)

👉 Voir `PAYMENT_SYSTEM_GUIDE.md` - Section Frais et commissions

### Comment faire un remboursement ?
Via les dashboards Stripe ou PayPal. Le webhook mettra à jour automatiquement la base de données.

👉 Voir `PAYMENT_SYSTEM_GUIDE.md` - Section Remboursements

---

## 🎯 Checklist Complète

Avant de marquer le système comme "prêt pour la production" :

### Configuration Stripe
- [ ] Compte Stripe créé et vérifié
- [ ] Clés API copiées (test ou live)
- [ ] Webhook créé avec URL correcte
- [ ] Événements sélectionnés
- [ ] Webhook Secret copié et ajouté dans Supabase
- [ ] Edge Function `stripe-connect` déployée
- [ ] Edge Function `stripe-payment` déployée
- [ ] Edge Function `stripe-webhook` déployée
- [ ] Test effectué avec "Send test webhook"
- [ ] Test effectué avec une vraie réservation

### Configuration PayPal
- [ ] Compte PayPal Business créé
- [ ] Application créée dans Developer Dashboard
- [ ] Client ID et Secret copiés
- [ ] Webhook créé avec URL correcte
- [ ] Événements sélectionnés
- [ ] Webhook ID copié et ajouté dans Supabase
- [ ] Edge Function `paypal-connect` déployée
- [ ] Edge Function `paypal-payment` déployée
- [ ] Edge Function `paypal-webhook` déployée
- [ ] Test effectué

### Frontend
- [ ] `VITE_STRIPE_PUBLIC_KEY` ajouté dans `.env`
- [ ] Composant `PaymentProviderSetup` intégré
- [ ] Composant `DepositPayment` intégré
- [ ] Test de connexion Stripe OK
- [ ] Test de connexion PayPal OK
- [ ] Test de paiement Stripe OK
- [ ] Test de paiement PayPal OK

### Base de données
- [ ] Tables créées (migration appliquée)
- [ ] RLS activé et policies créées
- [ ] Triggers fonctionnels
- [ ] Webhooks enregistrés dans `payment_webhooks_log`

---

## 📞 Support

Si vous avez des questions ou des problèmes :

1. **Consultez d'abord** les guides ci-dessus
2. **Vérifiez** la section FAQ de `SETUP_STRIPE_PAYPAL_TUTORIAL.md`
3. **Consultez** les logs Supabase Functions
4. **Vérifiez** la table `payment_webhooks_log` pour les erreurs
5. **Contactez** le support Stripe/PayPal si nécessaire

---

**Créé le** : 1er février 2026
**Dernière mise à jour** : 1er février 2026
**Version** : 1.0
