# Système d'abonnements Belleya

## Vue d'ensemble

Système complet de gestion des abonnements avec essai gratuit de 14 jours, 3 niveaux d'offres et gestion automatique des accès.

---

## Les 3 offres

### 1️⃣ BELLEYA START - 29€/mois

**Cible** : Indépendantes qui veulent structurer leur activité

**Fonctionnalités** :
- Gestion des objectifs et tâches
- Agenda intelligent synchronisé
- Réservation en ligne
- Jusqu'à 50 clientes
- Notifications automatiques
- Dashboard financier
- Gestion des réseaux sociaux
- Calendrier éditorial
- Boîte à idées IA
- Support WhatsApp 48h

### 2️⃣ BELLEYA STUDIO - 39€/mois (Le + populaire)

**Cible** : Professionnelles qui veulent scaler

**Fonctionnalités** :
- Tout START +
- Clientes illimitées
- Gestion des acomptes
- Gestion élèves/formations
- Marketing automatique par email
- Système de fidélisation
- Gestion des stocks
- Exports comptables
- Support WhatsApp 24h

### 3️⃣ BELLEYA EMPIRE - 59€/mois

**Cible** : Automatisation et revenus récurrents

**Fonctionnalités** :
- Tout STUDIO +
- Marketing automatisé avancé
- Campagnes multi-canaux (SMS + Email)
- Partenariat officiel Belleya
- Revenus d'affiliation
- Visibilité premium
- Support prioritaire express

---

## Architecture technique

### 1. Base de données

**Table : `subscriptions`**

```sql
- id (uuid, PK)
- company_id (uuid, FK → company_profiles)
- plan_type (text) : 'start' | 'studio' | 'empire'
- subscription_status (text) : 'trial' | 'active' | 'expired' | 'cancelled' | 'pending'
- trial_start_date (timestamptz)
- trial_end_date (timestamptz)
- subscription_start_date (timestamptz)
- subscription_end_date (timestamptz)
- payment_provider (text) : 'stripe' | 'paypal'
- payment_provider_subscription_id (text)
- monthly_price (decimal)
- is_legacy_price (boolean) - Prix bloqué à vie
- created_at (timestamptz)
- updated_at (timestamptz)
```

**Trigger automatique** :
- À la création d'un `company_profile`, un abonnement START en trial est automatiquement créé
- Trial de 14 jours par défaut

**Fonction RPC** : `get_subscription_status(p_company_id)`
- Retourne : is_trial, is_active, days_remaining, plan_type, subscription_status

**Indexes** :
- `idx_subscriptions_company_id`
- `idx_subscriptions_status`
- `idx_subscriptions_trial_end`

---

### 2. Composants frontend

#### Page Pricing (`src/pages/Pricing.tsx`)

- Design moderne avec 3 cartes d'offres
- Badge "Le + populaire" sur STUDIO
- Compteur de jours avant augmentation
- Bandeau "14 jours gratuits - sans engagement"
- Gestion automatique de l'abonnement existant
- Redirection après sélection

**Routes** :
- URL directe : `/pricing`
- Accessible depuis le bandeau trial
- Case dans la navigation interne

#### Trial Banner (`src/components/shared/TrialBanner.tsx`)

**Affichage conditionnel** :
- Si trial actif → Bandeau vert avec jours restants
- Si trial expiré → Bandeau rouge "Essai terminé"
- Si abonnement actif → Pas de bandeau

**Position** : En haut de l'application, au-dessus du main content

**Actions** :
- Bouton "Choisir mon offre" → Redirige vers `/pricing`
- Bouton fermer (X) → Cache le bandeau pour la session

#### Subscription Guard (`src/components/shared/SubscriptionGuard.tsx`)

**Rôle** : HOC pour protéger les routes qui nécessitent un abonnement actif

**Logique** :
1. Vérifie si l'utilisateur a un abonnement
2. Vérifie si l'abonnement est actif (trial valide OU abonnement payant)
3. Si non → Affiche écran de blocage avec redirection pricing
4. Si oui → Affiche le contenu

**Utilisation** :
```tsx
<SubscriptionGuard>
  <ProtectedPage />
</SubscriptionGuard>
```

---

### 3. Helpers (`src/lib/subscriptionHelpers.ts`)

**Fonctions disponibles** :

```typescript
// Récupère le statut d'abonnement
getSubscriptionStatus(companyId: string): Promise<SubscriptionStatus | null>

// Vérifie l'accès (actif ou non)
checkSubscriptionAccess(companyId: string): Promise<{ hasAccess: boolean, reason?: string }>

// Récupère le company_id de l'utilisateur connecté
getUserCompanyId(): Promise<string | null>

// Expire les trials expirés (cron)
expireTrialSubscriptions(): Promise<void>

// Helpers d'affichage
getPlanFeatures(planType: string): string[]
getPlanPrice(planType: string): { current: number; future: number }
getPlanName(planType: string): string
```

---

## Flux utilisateur

### Nouvel utilisateur

1. **Inscription** → Création automatique d'un abonnement START en trial (14 jours)
2. **Premier accès** → Bandeau vert "X jours restants" visible
3. **Pendant le trial** → Accès complet à toutes les fonctionnalités
4. **Jour 14** → Bandeau devient rouge "Essai terminé"
5. **Après expiration** → Blocage de l'accès + redirection vers `/pricing`

### Sélection d'une offre

1. Utilisateur clique sur "Choisir mon offre" ou visite `/pricing`
2. Choix parmi START, STUDIO ou EMPIRE
3. Clic sur "Commencer gratuitement"
4. Mise à jour de l'abonnement existant avec le plan choisi
5. Redirection vers dashboard
6. Prix bloqué à vie (`is_legacy_price = true`)

### Abonnement actif

1. Aucun bandeau affiché
2. Accès complet aux fonctionnalités du plan choisi
3. Pas de blocage

### Expiration du trial

1. Bandeau rouge "Essai terminé"
2. Tentative d'accès → Écran de blocage
3. Bouton "Voir les offres" → Redirection `/pricing`

---

## Intégration dans App.tsx

### Modifications apportées

1. **Import des composants** :
```tsx
import Pricing from './pages/Pricing';
import TrialBanner from './components/shared/TrialBanner';
```

2. **Route pricing** :
```tsx
if (isPricingPage) {
  return (
    <>
      <Pricing />
      <ChatBot />
    </>
  );
}
```

3. **Bandeau trial** :
```tsx
<div className="flex-1 flex flex-col overflow-hidden">
  <TrialBanner />
  <main className="flex-1 overflow-y-auto">
    {renderPage()}
  </main>
</div>
```

---

## Sécurité (RLS)

### Policies sur `subscriptions`

**SELECT** : Entreprise peut voir son propre abonnement
```sql
USING (company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid()))
```

**UPDATE** : Entreprise peut modifier son propre abonnement
```sql
USING (company_id IN (...))
WITH CHECK (company_id IN (...))
```

**INSERT** : Entreprise peut créer son propre abonnement
```sql
WITH CHECK (company_id IN (...))
```

---

## Gestion des paiements (À venir)

### Stripe integration

- Création de session checkout
- Webhooks pour confirmer paiement
- Mise à jour automatique du statut
- `payment_provider = 'stripe'`
- `payment_provider_subscription_id` stocké

### PayPal integration

- Même principe que Stripe
- `payment_provider = 'paypal'`

---

## Tâches de maintenance

### Cron job quotidien (recommandé)

**Fonction** : `expireTrialSubscriptions()`

**Action** : Met à jour les abonnements en trial dont la `trial_end_date` est dépassée

**Implémentation possible** :
```typescript
// Supabase Edge Function appelée quotidiennement
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await supabase
    .from('subscriptions')
    .update({ subscription_status: 'expired' })
    .eq('subscription_status', 'trial')
    .lt('trial_end_date', new Date().toISOString());

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## Tests recommandés

### 1. Création d'abonnement automatique
- [ ] Créer un nouveau compte
- [ ] Vérifier qu'un abonnement START trial est créé
- [ ] Vérifier que trial_end_date = now() + 14 jours

### 2. Affichage du bandeau
- [ ] Avec trial actif → Bandeau vert avec jours restants
- [ ] Avec trial expiré → Bandeau rouge
- [ ] Avec abonnement actif → Pas de bandeau

### 3. Sélection d'offre
- [ ] Cliquer sur STUDIO depuis `/pricing`
- [ ] Vérifier la redirection vers dashboard
- [ ] Vérifier que plan_type = 'studio'
- [ ] Vérifier que is_legacy_price = true

### 4. Blocage d'accès
- [ ] Mettre manuellement subscription_status = 'expired'
- [ ] Tenter d'accéder au dashboard
- [ ] Vérifier l'affichage de l'écran de blocage

### 5. Prix bloqué à vie
- [ ] Créer un abonnement avec is_legacy_price = true
- [ ] Vérifier que le prix ne change pas même si les tarifs augmentent

---

## Améliorations futures

### Phase 1 (Actuel)
- ✅ Système d'abonnement avec trial
- ✅ 3 niveaux d'offres
- ✅ Bandeau dynamique
- ✅ Blocage automatique

### Phase 2 (Paiements)
- [ ] Intégration Stripe
- [ ] Intégration PayPal
- [ ] Webhooks de confirmation
- [ ] Gestion des échecs de paiement
- [ ] Renouvellement automatique

### Phase 3 (Fonctionnalités avancées)
- [ ] Upgrade/downgrade entre plans
- [ ] Historique des paiements
- [ ] Factures automatiques
- [ ] Remises et codes promo
- [ ] Système d'affiliation (EMPIRE)

### Phase 4 (Analytics)
- [ ] Dashboard admin des abonnements
- [ ] Taux de conversion trial → payant
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Churn rate
- [ ] LTV (Lifetime Value)

---

## Fichiers créés/modifiés

### Nouveaux fichiers
- `supabase/migrations/[timestamp]_create_subscriptions_system.sql`
- `src/pages/Pricing.tsx`
- `src/lib/subscriptionHelpers.ts`
- `src/components/shared/TrialBanner.tsx`
- `src/components/shared/SubscriptionGuard.tsx`

### Fichiers modifiés
- `src/App.tsx` (ajout routes + bandeau)

---

## Support

Pour toute question ou problème :
- Documentation complète : Ce fichier
- Helpers disponibles : `src/lib/subscriptionHelpers.ts`
- Base de données : Table `subscriptions` avec RLS activé

---

**Dernière mise à jour** : 12 février 2026
**Version** : 1.0
**Statut** : Production ready (paiements à venir)
