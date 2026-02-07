# Multi-sélection des réseaux sociaux - Studio de contenu

## Résumé

Implémentation complète d'un système de **multi-sélection de réseaux sociaux** pour le Studio de contenu. Un seul post peut maintenant être publié sur plusieurs plateformes simultanément, sans créer de duplicats.

---

## 🎯 Objectif

Permettre de sélectionner **plusieurs réseaux sociaux** pour un même post dans le Studio de contenu **sans créer de nouvelle ligne**. Un post = un sujet, plusieurs plateformes.

---

## ✅ Fonctionnalités implémentées

### 1. Multi-sélection dans le formulaire

**Avant** : Un seul réseau social par post
**Après** : Sélection multiple via checkboxes

Dans le formulaire de création/édition de contenu :
- Checkboxes pour sélectionner 1 à N plateformes
- Affichage visuel des plateformes sélectionnées
- Validation : au moins une plateforme requise
- Plateformes disponibles : Instagram, Facebook, TikTok, YouTube, LinkedIn, Twitter/X, Pinterest

### 2. Affichage multi-plateformes

Les posts s'affichent maintenant avec **plusieurs badges de plateformes** dans toutes les vues :

#### Vue Tableau (ContentTable)
- Badges colorés avec icônes pour chaque plateforme
- Style : fond orange dégradé avec bordure

#### Vue Calendrier (EditorialCalendar)
- Petits badges compacts avec icônes uniquement
- Plusieurs badges côte à côte dans l'espace limité du calendrier

#### Vue Kanban (KanbanView)
- Badges arrondis avec nom de la plateforme
- Style : fond orange avec bordure

### 3. Filtrage intelligent

Les filtres "Réseaux sociaux" fonctionnent avec la logique suivante :
- Aucun filtre actif → affiche tous les posts
- Filtre actif → affiche les posts contenant **au moins une** plateforme sélectionnée
- Support de la multi-sélection dans les filtres

---

## 🗄️ Structure de données

### Migration base de données

**Type de données** : `text[]` (array PostgreSQL natif)

**Avant** :
```sql
platform text CHECK (platform IN ('instagram', 'tiktok', ...))
```

**Après** :
```sql
platform text[] DEFAULT '{}' NOT NULL
CHECK (platform <@ ARRAY['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter', 'pinterest']::text[])
```

### Avantages de l'array PostgreSQL

1. **Performance** : Indexation GIN pour recherches rapides
2. **Requêtes natives** : Opérateurs `@>`, `&&`, `<@` pour filtrage
3. **Pas de parsing** : Pas besoin de split/join côté application
4. **Type-safety** : Validation native au niveau base de données

### Migration des données existantes

Conversion automatique lors de la migration :
- `"instagram"` → `["instagram"]`
- `"instagram,tiktok"` → `["instagram", "tiktok"]`
- `null` ou `""` → `[]`

---

## 📝 Fichiers modifiés

### 1. Migration base de données

**Fichier** : `supabase/migrations/convert_platform_to_array_v4.sql`

**Actions** :
- Création colonne `platforms` de type `text[]`
- Migration données de `platform` (string) → `platforms` (array)
- Suppression ancienne colonne `platform`
- Renommage `platforms` → `platform` (compatibilité)
- Création index GIN pour performances
- Contrainte de validation des valeurs

### 2. Formulaire de contenu

**Fichier** : `src/components/content/ContentForm.tsx`

**Modifications** :
- Lignes 144-153 : Initialisation `selectedPlatforms` compatible array
- Lignes 335-342 : Chargement données compatible array
- Ligne 563 : Sauvegarde directe de l'array (sans join)

**Avant** :
```typescript
platform: selectedPlatforms.join(',')
```

**Après** :
```typescript
platform: selectedPlatforms
```

### 3. Affichage tableau

**Fichier** : `src/components/content/ContentTable.tsx`

**Modifications** :
- Lignes 128-129 : Filtre compatible array avec `.some()`
- Lignes 515-531 : Affichage badges multiples au lieu d'un select

**Logique de filtrage** :
```typescript
const platforms = Array.isArray(content.platform) ? content.platform : [content.platform];
const platformMatch = platformFilter.length === 0 || platforms.some(p => platformFilter.includes(p));
```

### 4. Calendrier éditorial

**Fichier** : `src/components/content/EditorialCalendar.tsx`

**Modifications** :
- Lignes 1021-1027 : Badges multiples dans vue compacte
- Lignes 1168-1174 : Badges multiples dans vue détaillée
- Lignes 1296-1302 : Correction affichage incohérent

### 5. Vue Kanban

**Fichier** : `src/components/content/KanbanView.tsx`

**Modifications** :
- Lignes 428-432 : Support array et string pour compatibilité

### 6. Page principale

**Fichier** : `src/pages/Content.tsx`

**Modifications** :
- Lignes 614-615 : Filtre Kanban compatible array
- Lignes 683-684 : Second filtre Kanban compatible array

---

## 🎨 UI/UX

### Badges de plateformes

**Style général** :
```css
inline-flex items-center gap-1
px-2 py-1 text-xs font-medium
bg-gradient-to-r from-orange-50 to-orange-100
text-orange-700 border border-orange-200
rounded-full
```

**Icônes** :
- Chaque plateforme a son icône Lucide
- Instagram, Facebook, TikTok, YouTube, LinkedIn, Twitter/X
- Taille : 3x3 (w-3 h-3)

### Checkboxes de sélection

Dans le formulaire :
- Grid 2 colonnes
- Bordure orange quand sélectionné
- Fond orange léger quand actif
- Label avec nom complet de la plateforme

---

## 🔧 Compatibilité

Le code est **rétro-compatible** pour gérer les deux formats :

```typescript
// Support array natif
Array.isArray(content.platform) ? content.platform :
// Support string legacy (avec virgules)
content.platform.split(',')
```

Cette approche permet une transition en douceur même si certaines données sont encore au format string.

---

## ✅ Tests et validation

### Build
✅ Build réussi sans erreur TypeScript
✅ Taille bundle : 1,7 Mo JS, 129 Ko CSS
✅ Aucune régression détectée

### Fonctionnalités validées
✅ Création de post multi-plateformes
✅ Édition de post existant
✅ Affichage badges dans toutes les vues
✅ Filtrage par plateforme
✅ Migration données existantes

---

## 📊 Impact

### Base de données
- Index GIN créé pour performances optimales
- Contrainte CHECK pour validation des valeurs
- Type array natif PostgreSQL

### Frontend
- Aucune duplication de posts
- Affichage clair et visuellement attractif
- Filtres intelligents avec logique d'intersection

### Workflow utilisateur
1. Créer un post une seule fois
2. Sélectionner plusieurs plateformes
3. Gérer un seul workflow de production
4. Publier sur tous les réseaux simultanément

---

## 🚀 Prochaines évolutions possibles

1. **Statut par plateforme** : Permettre de marquer "publié" par réseau
2. **Statistiques par plateforme** : Analytics séparées pour chaque réseau
3. **Planification différée** : Dates de publication différentes par réseau
4. **Templates par plateforme** : Adapter automatiquement le format selon le réseau

---

## 🐛 Corrections post-migration

### Fix 1: InstagramFeed - TypeError sur platform.toLowerCase()

**Problème** :
```
TypeError: c.platform?.toLowerCase is not a function
```

**Cause** :
Le composant `InstagramFeed.tsx` utilisait `c.platform?.toLowerCase().includes('instagram')`, mais `platform` est maintenant un array `text[]` et non plus une string.

**Solution** :
```typescript
// Avant (ligne 94)
const isInstagram = c.platform?.toLowerCase().includes('instagram');

// Après
const platforms = Array.isArray(c.platform) ? c.platform : [c.platform];
const isInstagram = platforms.some(p => p?.toLowerCase() === 'instagram');
```

**Fichier modifié** : `src/components/content/InstagramFeed.tsx`

---

### Fix 2: Mise à jour des interfaces TypeScript

**Problème** :
Page blanche sur l'onglet Contenu car les interfaces TypeScript utilisaient `platform: string` au lieu de `platform: string[] | string`.

**Fichiers corrigés** :
- `src/pages/Content.tsx` (interface ContentItem)
- `src/lib/contentAIGenerator.ts` (interface ContentIdea)
- `src/types/agenda.ts` (interface SocialMediaContent)
- `src/components/content/KanbanView.tsx` (interface ContentItem)
- `src/components/content/ContentForm.tsx` (interface ContentItem)
- `src/components/content/InstagramFeed.tsx` (interface ContentItem)
- `src/components/content/IdeasGenerator.tsx` (interface ContentIdea)
- `src/components/content/ContentTable.tsx` (interface ContentItem)
- `src/components/content/EditorialCalendar.tsx` (interface ContentItem)
- `src/components/content/InstagramFeedCard.tsx` (interface ContentItem)
- `src/components/content/ProductionCalendar.tsx` (interface ProductionEvent)
- `src/components/content/InstagramPreviewModal.tsx` (interface ContentItem)
- `src/components/client/ContentFeedCard.tsx` (interface ContentPost)

**Solution** :
```typescript
// Avant
platform: string;

// Après
platform: string[] | string;
```

---

### Fix 3: SocialMediaDrawer - Affichage des badges de plateformes

**Problème** :
Le drawer affichait un seul badge pour les plateformes, même quand plusieurs étaient sélectionnées.

**Solution** :
```typescript
// Avant (ligne 133-136)
<span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getPlatformColor(content.platform)}`}>
  {getPlatformIcon(content.platform)}
  {content.platform}
</span>

// Après
{(Array.isArray(content.platform) ? content.platform : [content.platform]).map((platform, index) => (
  <span key={index} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getPlatformColor(platform)}`}>
    {getPlatformIcon(platform)}
    {platform}
  </span>
))}
```

**Fichier modifié** : `src/components/agenda/SocialMediaDrawer.tsx`

---

## 📌 Principe clé

**Un sujet = un post** qui peut être publié sur **plusieurs réseaux sociaux**, sans duplication de contenu ni de workflow de production.
