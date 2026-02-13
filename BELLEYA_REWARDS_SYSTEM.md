# Système de Récompenses Belleya

## Vue d'ensemble

Le système de récompenses Belleya permet aux prestataires de gagner jusqu'à **2 mois gratuits** en soutenant l'application sur Instagram. Le système comprend deux missions distinctes avec validation administrative et intégration automatique des avis approuvés sur la landing page.

## Fonctionnalités principales

### 1. Encart Belleya dans les Partenariats

Un encart officiel "Belleya" est affiché en permanence dans l'onglet **Partenariats** :

- **Logo Belleya** avec badge "Officiel"
- **Lien Instagram** : [@belleya.app](https://www.instagram.com/belleya.app/)
- **Affichage des mois gratuits** accumulés
- **Deux missions** distinctes avec statut en temps réel

**Emplacement** : `/src/components/partnerships/BelleyaRewardsCard.tsx`

### 2. Mission #1 - Follow + Commentaire

**Récompense** : +1 mois gratuit

#### Conditions requises :
- S'abonner au compte Instagram @belleya.app
- Laisser un commentaire de **minimum 100 caractères**
- Fournir une **capture d'écran** montrant :
  - L'abonnement à @belleya.app
  - La photo de profil visible (preuve d'identité)
- Saisir le **pseudo Instagram** (obligatoire, format @pseudo)
- Copier le **texte du commentaire** (avec compteur de caractères)
- Lien du post commenté (optionnel)

#### Validation front-end :
- Le bouton est désactivé si :
  - Le pseudo ne commence pas par @
  - Le commentaire a moins de 100 caractères
  - Aucune image n'est uploadée

**Emplacement** : `/src/components/partnerships/MissionOneModal.tsx`

### 3. Mission #2 - Vidéo Avis

**Récompense** : +1 mois gratuit additionnel

**Prérequis** : La Mission #1 doit être approuvée

#### Conditions requises :
- Créer une vidéo mentionnant @belleya.app
- **Consentement commercial obligatoire** (checkbox)
  - "J'autorise Belleya à réutiliser cette vidéo à des fins commerciales et/ou sur la landing page"
- Upload de la vidéo (jusqu'à 100 MB) OU lien Instagram
- Pseudo Instagram (optionnel)

#### Modes de soumission :
1. **Upload direct** : MP4, MOV, max 100 MB
2. **Lien Instagram** : URL du Reel/post

**Emplacement** : `/src/components/partnerships/MissionTwoModal.tsx`

### 4. Interface Admin - Validation des Avis

Un nouvel onglet **"Avis & Récompenses"** dans l'interface admin permet de :

#### Fonctionnalités principales :
- **Filtres** : Tous / En attente / Approuvés / Refusés
- **Vue détaillée** de chaque soumission avec :
  - Informations du prestataire (nom, email, Instagram)
  - Capture d'écran (Mission #1)
  - Texte du commentaire avec compteur de caractères
  - Vidéo (Mission #2) avec player intégré
  - Statut du consentement commercial

#### Actions admin :
- **Approuver** : Crédite automatiquement 1 mois gratuit + notification
- **Refuser** : Avec champ "raison du refus" obligatoire + notification

#### Notifications automatiques :
- **Approbation** : "Félicitations ! Votre [mission] a été validée. +1 mois gratuit ajouté."
- **Refus** : "Votre demande a été refusée. Raison : [note admin]"

**Emplacement** : `/src/components/admin/RewardsValidation.tsx`

### 5. Intégration Landing Page

Lorsqu'une Mission #2 est approuvée, l'avis est **automatiquement publié** sur la landing page dans une nouvelle section "Ils ont essayé Belleya".

#### Affichage :
- Grille responsive (1/2/3 colonnes selon écran)
- Format vertical (9:16) optimisé pour Stories/Reels
- Player vidéo avec bouton play
- Avatar, nom et métier du prestataire
- Citation (si fournie)
- 5 étoiles par défaut

#### Contrôle admin :
- Les admins peuvent masquer un avis via `is_published = false`
- Modifier le nom d'affichage, métier, avatar
- Réordonner via `display_order`

**Emplacement** : `/src/components/landing/ReviewsSection.tsx`

## Architecture Base de Données

### Table : `belleya_rewards_submissions`

Stocke toutes les soumissions de missions.

```sql
- id (uuid)
- provider_id (uuid) → company_profiles
- mission_type ('follow_comment' | 'video_review')
- status ('pending' | 'approved' | 'rejected')

-- Mission #1
- instagram_handle (text)
- proof_image_url (text)
- comment_text (text)
- comment_post_url (text, nullable)

-- Mission #2
- video_url (text, nullable)
- video_storage_url (text, nullable)
- consent_commercial (boolean)

-- Admin
- admin_note (text, nullable)
- reviewed_at (timestamptz)
- reviewed_by (uuid)

- created_at (timestamptz)
- updated_at (timestamptz)
```

### Table : `landing_reviews`

Stocke les avis publiés sur la landing page.

```sql
- id (uuid)
- submission_id (uuid) → belleya_rewards_submissions
- provider_id (uuid) → company_profiles

- display_name (text)
- job_title (text, nullable)
- avatar_url (text, nullable)
- video_url (text)
- quote (text, nullable)

- is_published (boolean, default true)
- display_order (int, default 0)

- created_at (timestamptz)
- updated_at (timestamptz)
```

### Champ ajouté : `company_profiles.free_months_balance`

Type : `int`, défaut `0`

Compteur des mois gratuits accumulés par le prestataire.

## Storage Buckets

### 1. `rewards-proof-images`
- Captures d'écran pour Mission #1
- Public read
- Structure : `{user_id}/{timestamp}.{ext}`

### 2. `rewards-videos`
- Vidéos pour Mission #2
- Public read
- Structure : `{user_id}/{timestamp}.{ext}`

## Triggers & Automatisations

### 1. `auto_create_landing_review()`
**Déclencheur** : Après UPDATE sur `belleya_rewards_submissions`

**Condition** : `mission_type = 'video_review'` ET `status = 'approved'`

**Action** : Crée automatiquement une entrée dans `landing_reviews` avec :
- `display_name` = company_name
- `job_title` = profession
- `avatar_url` = logo_url
- `video_url` = video_storage_url OU video_url
- `quote` = comment_text (si disponible)
- `is_published` = true

### 2. `credit_free_months()`
**Déclencheur** : Après UPDATE sur `belleya_rewards_submissions`

**Actions** :

#### Si approuvé :
1. Incrémente `company_profiles.free_months_balance` de +1
2. Crée notification :
   - Type : `reward_approved`
   - Message selon mission type

#### Si refusé :
1. Crée notification :
   - Type : `reward_rejected`
   - Message : "Votre demande a été refusée. Raison : [admin_note]"

## Sécurité (RLS)

### `belleya_rewards_submissions`

**Providers** :
- `SELECT` : Leurs propres soumissions uniquement
- `INSERT` : Peuvent créer des soumissions

**Admins** :
- `SELECT` : Toutes les soumissions
- `UPDATE` : Approuver/refuser toutes les soumissions

### `landing_reviews`

**Public** (anon + authenticated) :
- `SELECT` : Uniquement `is_published = true`

**Admins** :
- `SELECT` : Tous les avis
- `INSERT`, `UPDATE`, `DELETE` : Gestion complète

## Helpers & Utilitaires

**Fichier** : `/src/lib/rewardsHelpers.ts`

### Fonctions principales :

```typescript
// Provider
getProviderSubmissions(providerId: string)
createFollowCommentSubmission(providerId, data)
createVideoReviewSubmission(providerId, data)
uploadProofImage(userId, file)
uploadRewardVideo(userId, file)
getFreeMonthsBalance(providerId)

// Admin
getAllSubmissions()
approveSubmission(submissionId, adminNote?)
rejectSubmission(submissionId, adminNote)

// Landing
getPublishedReviews()
getAllReviews()
updateReviewPublishStatus(reviewId, isPublished)
updateReview(reviewId, updates)
deleteReview(reviewId)
```

## Workflow Complet

### Côté Prestataire

1. **Accès** : Onglet Partenariats → Encart Belleya
2. **Mission #1** :
   - Clic "Participer"
   - Remplit formulaire (Instagram + commentaire + image)
   - Soumet → Statut "En attente"
3. **Validation admin** → Notification + +1 mois offert
4. **Mission #2** (débloquée) :
   - Upload vidéo OU lien Instagram
   - Accepte consentement commercial
   - Soumet → Statut "En attente"
5. **Validation admin** → Notification + +1 mois offert + Avis sur landing

### Côté Admin

1. **Accès** : Admin → Onglet "Avis & Récompenses"
2. **Filtrer** : Sélectionner "En attente"
3. **Examiner** :
   - Clic sur soumission → Modal détails
   - Vérifier capture/vidéo
   - Vérifier commentaire (min 100 caractères)
   - Vérifier consentement (Mission #2)
4. **Décision** :
   - **Approuver** : Crédite automatiquement + notifie
   - **Refuser** : Saisir raison obligatoire + notifie
5. **Gestion landing** (optionnel) :
   - Modifier nom/métier/avatar
   - Masquer (`is_published = false`)
   - Réordonner (`display_order`)

## Tests Recommandés

### 1. Soumission Mission #1
- [ ] Impossible de soumettre sans @
- [ ] Impossible de soumettre avec commentaire < 100 caractères
- [ ] Impossible de soumettre sans image
- [ ] Upload image > 5 MB refusé
- [ ] Soumission réussie → Statut "En attente"

### 2. Soumission Mission #2
- [ ] Mission #2 bloquée si Mission #1 non approuvée
- [ ] Impossible de soumettre sans consentement
- [ ] Upload vidéo > 100 MB refusé
- [ ] Choix upload / lien fonctionne
- [ ] Soumission réussie → Statut "En attente"

### 3. Validation Admin
- [ ] Admin voit toutes les soumissions
- [ ] Filtres fonctionnent (tous/pending/approved/rejected)
- [ ] Modal détails affiche toutes les infos
- [ ] Approbation → +1 mois offert + notification
- [ ] Refus → notification avec raison

### 4. Landing Page
- [ ] Mission #2 approuvée → Avis apparaît automatiquement
- [ ] Vidéo joue correctement
- [ ] Admin peut masquer un avis
- [ ] Avis masqués n'apparaissent pas côté public

## Notes Importantes

1. **Non-supprimable** : L'encart Belleya ne peut pas être supprimé par les prestataires
2. **Ordre** : Mission #2 est strictement bloquée tant que Mission #1 n'est pas approuvée
3. **Notifications** : Utilise le système de notifications existant (table `notifications`)
4. **Consentement** : Obligatoire pour Mission #2, refus si non coché
5. **Crédits** : Les mois gratuits sont cumulables et stockés dans `free_months_balance`
6. **Auto-publication** : Les avis Mission #2 sont publiés automatiquement après approbation
7. **Contrôle admin** : Les admins ont un contrôle total sur ce qui s'affiche sur la landing

## Fichiers Clés

### Frontend
- `/src/components/partnerships/BelleyaRewardsCard.tsx` - Encart principal
- `/src/components/partnerships/MissionOneModal.tsx` - Formulaire Mission #1
- `/src/components/partnerships/MissionTwoModal.tsx` - Formulaire Mission #2
- `/src/components/admin/RewardsValidation.tsx` - Interface validation admin
- `/src/components/landing/ReviewsSection.tsx` - Section avis sur landing
- `/src/lib/rewardsHelpers.ts` - Fonctions utilitaires

### Backend
- Migration : `create_belleya_rewards_system.sql`
- Storage : `create_belleya_rewards_storage_buckets.sql`

## Support

Pour toute question ou problème, contactez l'équipe de développement Belleya.

---

**Version** : 1.0
**Date** : 13 Février 2026
**Auteur** : Lead Developer Belleya
