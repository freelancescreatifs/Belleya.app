# Améliorations du système d'abonnements Belleya

## Vue d'ensemble

Refonte complète de la section Offres & Abonnements avec copywriting premium, structure claire et fonctionnalités avancées.

---

## 🎯 Objectifs atteints

✅ Amélioration du copywriting (plus premium, plus structuré)
✅ Clarification des différences entre les 3 plans
✅ Mise en avant de l'augmentation prochaine des prix
✅ Système d'essai gratuit 14 jours opérationnel
✅ Blocage automatique après 14 jours sans paiement
✅ Interface pour voir son abonnement actuel

---

## 🆕 Nouvelles fonctionnalités

### 1. Page Pricing améliorée

**Localisation** : `src/pages/Pricing.tsx`

**Améliorations** :

#### Copywriting structuré par sections
Chaque plan affiche maintenant ses fonctionnalités organisées par catégories :

**START** :
- ✅ Organisation & Structure
- 📱 Réseaux sociaux intégrés
- 💰 Gestion financière simplifiée
- 🎯 Idéal pour se structurer dès le départ

**STUDIO** :
- ✨ Tout Start inclus +
- 💼 Business & Clients
- 📈 Croissance & Marketing
- 💰 Finance avancée
- 🎯 Idéal pour augmenter ton chiffre d'affaires

**EMPIRE** :
- ✨ Tout Studio inclus +
- 🚀 Expansion & Automatisation
- 🤝 Revenus complémentaires
- ⚡ Support prioritaire express
- 🎯 Idéal pour remplir automatiquement ton agenda et scaler

#### Badge "Le plus choisi"
- Badge orange sur STUDIO au lieu de "Le + populaire"
- Plus professionnel et business-oriented

#### Tableau comparatif
Nouveau tableau de comparaison des fonctionnalités entre les 3 plans :
- Nombre de clientes (50 / Illimité / Illimité)
- Fonctionnalités communes (avec ✓)
- Fonctionnalités exclusives par plan
- Type de support (48h / 24h / Prioritaire)

#### Design premium
- Cartes avec effet hover scale
- Gradients colorés par plan
- Espacement et hiérarchie visuelle améliorés
- Badge "Prix bloqué à vie" mis en avant

---

### 2. Section "Mon abonnement" dans Settings

**Localisation** : `src/components/settings/SubscriptionStatus.tsx`

**Nouveau tab dans Settings** :
- Icône couronne (Crown)
- Accessible via Settings → Mon abonnement

**Affichage** :
- Carte avec gradient selon le plan (vert/orange/violet)
- Nom du plan avec icône
- Prix mensuel actuel
- Badge "Prix bloqué à vie" si applicable
- Statut (Essai gratuit actif / Actif / Expiré)
- Jours restants d'essai
- Dates importantes :
  - Début d'abonnement
  - Fin de l'essai (si trial)
- Moyen de paiement (si configuré)

**Actions** :
- Bouton "Activer mon abonnement" (si trial)
- Bouton "Changer d'offre" (si actif)

**Messages informatifs** :
- Alerte verte pendant le trial avec date d'expiration
- Message explicatif sur le blocage post-trial

---

### 3. Trial Banner amélioré

**Localisation** : `src/components/shared/TrialBanner.tsx`

**Déjà fonctionnel** :
- Bandeau vert pendant l'essai avec jours restants
- Bandeau rouge à l'expiration
- Boutons d'action vers /pricing
- Bouton fermer pour masquer temporairement

**Positionnement** :
- En haut de l'application (au-dessus du main content)
- Visible sur toutes les pages
- Adaptatif mobile/desktop

---

### 4. Subscription Guard

**Localisation** : `src/components/shared/SubscriptionGuard.tsx`

**Fonctionnalité** :
- HOC pour protéger les routes/composants
- Vérifie l'accès avant affichage
- Écran de blocage élégant si expiré
- Redirection automatique vers /pricing

**Utilisation** :
```tsx
<SubscriptionGuard>
  <ProtectedFeature />
</SubscriptionGuard>
```

---

## 📊 Tableau de comparaison des plans

| Fonctionnalité | START | STUDIO | EMPIRE |
|----------------|-------|--------|--------|
| **Prix** | 29€/mois | 39€/mois | 59€/mois |
| **Augmentation** | Bientôt 39€ | Bientôt 49€ | Bientôt 79€ |
| **Clientes** | 50 | Illimité | Illimité |
| **Agenda intelligent** | ✓ | ✓ | ✓ |
| **Réservation en ligne** | ✓ | ✓ | ✓ |
| **Réseaux sociaux** | ✓ | ✓ | ✓ |
| **Boîte à idées IA** | ✓ | ✓ | ✓ |
| **Gestion acomptes** | - | ✓ | ✓ |
| **Gestion formations** | - | ✓ | ✓ |
| **Marketing auto** | - | ✓ | ✓ |
| **Fidélisation** | - | ✓ | ✓ |
| **SMS + Email** | - | - | ✓ |
| **Affiliation** | - | - | ✓ |
| **Support** | 48h | 24h | Prioritaire |

---

## 🎨 Design & UX

### Hiérarchie visuelle

**Couleurs par plan** :
- **START** : Vert émeraude (emerald-500 to teal-500)
- **STUDIO** : Orange ambré (amber-500 to orange-500)
- **EMPIRE** : Violet royal (purple-500 to pink-500)

### Typographie
- Titres de plans : 2xl, bold
- Prix : 5xl, bold
- Descriptions : base, text-slate-600
- Sections : emoji + bold pour les catégories

### Animations
- Hover scale sur les cartes (scale-105)
- Transitions smooth sur tous les boutons
- Spinner pendant l'activation

### Responsive
- Grid 3 colonnes sur desktop
- Empilement vertical sur mobile
- Tableau comparatif scroll horizontal

---

## 🔄 Flux utilisateur complet

### 1. Inscription
```
Nouvel utilisateur
    ↓
Création compte → trigger auto crée subscription START trial
    ↓
trial_start_date = now()
trial_end_date = now() + 14 jours
subscription_status = 'trial'
```

### 2. Pendant l'essai (J1-J14)
```
Connexion dashboard
    ↓
Trial Banner vert visible
"Il vous reste X jours d'essai gratuit"
    ↓
Accès complet aux fonctionnalités
    ↓
Settings → Mon abonnement
    ↓
Carte avec infos détaillées + date fin essai
```

### 3. Jour 14 (expiration)
```
Cron job quotidien vérifie trial_end_date
    ↓
Si dépassé + no payment:
subscription_status = 'expired'
    ↓
Trial Banner devient rouge
"Votre essai gratuit est terminé"
```

### 4. Tentative d'accès après expiration
```
Utilisateur tente d'accéder à l'app
    ↓
SubscriptionGuard vérifie l'accès
    ↓
access.hasAccess = false
    ↓
Affiche écran de blocage
"Votre période d'essai de 14 jours est terminée"
    ↓
Bouton "Voir les offres" → /pricing
```

### 5. Sélection d'une offre
```
/pricing → Choix d'un plan
    ↓
Clic "Commencer gratuitement"
    ↓
Si trial existant:
  UPDATE subscription SET plan_type, monthly_price, is_legacy_price=true
Sinon:
  INSERT nouveau trial
    ↓
Redirection dashboard
    ↓
Accès restauré
Prix bloqué à vie
```

### 6. Après paiement (futur)
```
Webhook Stripe/PayPal
    ↓
UPDATE subscription SET
  subscription_status = 'active'
  payment_provider = 'stripe'|'paypal'
  payment_provider_subscription_id = xxx
  subscription_start_date = now()
    ↓
Trial Banner disparaît
Accès permanent
```

---

## 🛠️ Fichiers créés/modifiés

### Nouveaux fichiers
```
src/components/settings/SubscriptionStatus.tsx
BELLEYA_SUBSCRIPTION_IMPROVEMENTS.md (ce fichier)
```

### Fichiers modifiés
```
src/pages/Pricing.tsx
  - Copywriting restructuré par sections
  - Tableau comparatif ajouté
  - Badge "Le plus choisi"
  - Gestion emojis dans features

src/pages/Settings.tsx
  - Import SubscriptionStatus
  - Nouveau tab "Mon abonnement"
  - Type de tab élargi
  - Icône Crown ajoutée
```

---

## 📱 Interface utilisateur

### Page Pricing (/pricing)

**Header** :
- Badge "Augmentation dans 30 jours"
- Titre "Les Offres Belleya"
- Sous-titre
- Badge "14 jours gratuits - accès complet - sans engagement"

**Cartes des plans** :
- 3 cartes côte à côte
- Badge "Le plus choisi" sur STUDIO
- Icône + nom du plan
- Prix actuel en gros
- Mention "Bientôt X€"
- Description courte
- Bouton CTA "Commencer gratuitement"
- Liste de features avec sections

**Tableau comparatif** :
- Design propre avec alternance de lignes
- Checks verts pour les fonctionnalités incluses
- Tirets gris pour les absentes
- Détails chiffrés (nb clientes, support)

**Footer** :
- Section "Pourquoi Belleya ?"
- 3 statistiques clés
- Design dark avec gradients colorés

### Settings → Mon abonnement

**Carte abonnement** :
- Header coloré selon plan
- Badge "Prix bloqué à vie"
- Prix mensuel en gros
- Badge essai si trial
- Section détails avec lignes
- Alerte verte si trial
- Bouton action principal

---

## ✨ Points clés du copywriting

### Vocabulaire premium
- "Scaler" au lieu de "grandir"
- "Automatiser" plutôt que "faciliter"
- "Générer des revenus récurrents"
- "Optimisation conversion"
- "Revenus complémentaires"

### Structure claire
- Sections avec emojis
- Hiérarchie visuelle forte
- Call-to-action explicite à la fin de chaque plan

### Orientation bénéfices
- "Arrêter de tout gérer à la main"
- "Augmenter ton chiffre d'affaires"
- "Remplir automatiquement ton agenda"

### Urgence et rareté
- "Augmentation dans X jours"
- "Prix bloqué à vie pour les premières inscrites"
- "Bientôt X€"

---

## 🎯 Prochaines étapes

### Phase 2 : Paiements
- [ ] Intégration Stripe checkout
- [ ] Intégration PayPal checkout
- [ ] Webhooks de confirmation
- [ ] Mise à jour automatique du statut
- [ ] Gestion des renouvellements

### Phase 3 : Analytics
- [ ] Dashboard admin des abonnements
- [ ] Taux de conversion trial → payant
- [ ] MRR tracking
- [ ] Churn analysis
- [ ] Notification avant fin de trial (J-3, J-1)

### Phase 4 : Fonctionnalités avancées
- [ ] Upgrade/downgrade entre plans
- [ ] Codes promo
- [ ] Système d'affiliation pour EMPIRE
- [ ] Factures PDF automatiques
- [ ] Historique des paiements

---

## 📝 Changelog

**12 février 2026 - v2.0**

**Ajouté** :
- Copywriting restructuré par sections avec emojis
- Tableau comparatif des fonctionnalités
- Section "Mon abonnement" dans Settings
- Badge "Le plus choisi" au lieu de "Le + populaire"
- Composant SubscriptionStatus avec infos détaillées
- Tab "Mon abonnement" dans Settings

**Amélioré** :
- Organisation visuelle des features par catégories
- Hiérarchie de l'information sur les cartes
- Design des badges et alertes
- Messages d'orientation bénéfices

**Modifié** :
- Gestion des titres de sections (emojis sans checkmark)
- Rendu conditionnel des features
- Structure de la page Pricing
- Navigation Settings

---

## 🧪 Tests recommandés

### 1. Affichage de la page Pricing
- [ ] Vérifier que les 3 cartes s'affichent correctement
- [ ] Badge "Le plus choisi" visible sur STUDIO
- [ ] Sections avec emojis sans checkmark
- [ ] Tableau comparatif lisible et responsive
- [ ] Compteur "Augmentation dans X jours"

### 2. Section Mon abonnement
- [ ] Ouvrir Settings → Mon abonnement
- [ ] Vérifier l'affichage du plan actuel
- [ ] Badge "Prix bloqué à vie" visible si applicable
- [ ] Statut trial avec jours restants
- [ ] Dates d'abonnement correctes
- [ ] Boutons d'action fonctionnels

### 3. Sélection d'une offre
- [ ] Cliquer sur "Commencer gratuitement"
- [ ] Vérifier la création/mise à jour de l'abonnement
- [ ] Vérifier is_legacy_price = true
- [ ] Redirection vers dashboard
- [ ] Trial Banner s'affiche avec le bon nombre de jours

### 4. Tableau comparatif
- [ ] Toutes les lignes visibles
- [ ] Checks verts bien placés
- [ ] Tirets gris pour les absents
- [ ] Scroll horizontal sur mobile

### 5. Responsive
- [ ] Page Pricing sur mobile (empilement vertical)
- [ ] Tableau comparatif scroll horizontal
- [ ] Mon abonnement lisible sur petit écran
- [ ] Trial Banner adaptatif

---

## 💡 Conseils d'utilisation

### Pour les utilisateurs

**Pendant l'essai** :
1. Profitez de toutes les fonctionnalités sans restriction
2. Consultez "Mon abonnement" pour voir les jours restants
3. Aucune carte bancaire requise pendant les 14 jours

**Avant la fin de l'essai** :
1. Choisissez votre offre depuis le Trial Banner ou Settings
2. Le prix affiché sera bloqué à vie
3. Activez le paiement pour continuer après J14

**Après l'essai** :
1. Si expiré : redirection automatique vers /pricing
2. Vos données restent sauvegardées
3. Accès immédiat après activation du paiement

### Pour les admins

**Surveillance** :
- Consulter régulièrement la table `subscriptions`
- Vérifier les trials qui arrivent à expiration
- Monitorer le taux de conversion

**Communication** :
- Envoyer des emails J-3 et J-1 avant expiration
- Proposer des offres spéciales si nécessaire
- Accompagner les utilisateurs dans le choix du plan

---

**Dernière mise à jour** : 12 février 2026
**Version** : 2.0
**Statut** : Production ready (paiements à venir)
