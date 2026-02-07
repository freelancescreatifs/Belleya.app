# Système de Publication des Photos BelleYa

## Vue d'ensemble

Le système de publication des photos unifie la gestion des photos de résultats clients avec des règles claires sur où déposer les photos et où elles apparaissent.

## 🎯 Règles de Publication

### Deux Sources de Dépôt

Les photos peuvent être déposées depuis **DEUX sources uniquement** :

#### 1. Source Prestataire - Galerie Client
**Chemin** : `Clients → [Sélectionner une cliente] → Galerie → Ses résultats`
- Permet au prestataire d'uploader des photos de résultats pour une cliente spécifique
- **Champs obligatoires** :
  - Catégorie (ex: Ongles, Cils, Cheveux, etc.)
  - Service associé (filtré par catégorie sélectionnée)
  - Description (optionnelle)

#### 2. Source Profil Public - Galerie
**Chemin** : `Profil Public Prestataire → Onglet Galerie → Bouton +`
- Permet au prestataire d'ajouter directement des photos à sa galerie publique
- **Champs obligatoires** :
  - Catégorie (provenant des types de services actifs)
  - Service associé (filtré par catégorie sélectionnée)

### Trois Lieux d'Affichage Automatiques

Peu importe la source utilisée, toute photo publiée apparaît automatiquement dans **TROIS endroits** :

#### 1. Feed "Pour toi" - Espace Client
- **Emplacement** : Page d'accueil client → Onglet "Pour toi"
- **Visibilité** : Toutes les clientes
- **Contenu** : Toutes les photos publiées par tous les prestataires
- **Filtrage** : Photos avec `show_in_gallery = true` et `service_name` non null

#### 2. Section "Suivies" - Espace Client
- **Emplacement** : Page d'accueil client → Onglet "Suivies"
- **Visibilité** : Uniquement la cliente connectée
- **Contenu** : Photos uniquement des prestataires suivis par la cliente
- **Filtrage** : Basé sur la table `provider_follows`

#### 3. Profil Public Prestataire - Galerie
- **Emplacement** : `Profil Public → Onglet Galerie`
- **Visibilité** : Public (toute personne visitant le profil)
- **Contenu** : Photos du prestataire uniquement
- **Filtrage** : Photos avec `show_in_gallery = true` et appartenant au prestataire

## 📊 Structure de Données

### Table : `client_results_photos`

```sql
CREATE TABLE client_results_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text,           -- Catégorie (Ongles, Cils, etc.)
  caption text,                -- Description optionnelle
  show_in_gallery boolean DEFAULT true,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### Champs Clés

- **photo_url** : URL de la photo stockée dans `client-media` bucket
- **service_name** : Catégorie de service (OBLIGATOIRE pour affichage)
- **service_id** : ID du service spécifique (OBLIGATOIRE)
- **show_in_gallery** : Boolean qui contrôle la visibilité (toujours `true` pour les photos publiées)
- **company_id** : ID de l'entreprise du prestataire
- **client_id** : ID de la cliente (peut être null si ajouté depuis profil public)

## 🔄 Flux de Publication

### Depuis Galerie Client (Source 1)

1. Prestataire navigue vers `Clients → [Cliente] → Galerie → Ses résultats`
2. Clique sur le bouton d'upload
3. Sélectionne une ou plusieurs photos
4. Modal s'ouvre avec :
   - Prévisualisation des photos
   - Sélecteur de **Catégorie** (obligatoire)
   - Sélecteur de **Service** (obligatoire, filtré par catégorie)
   - Champ **Description** (optionnel)
   - Message d'information sur la publication automatique
5. Clique sur "Publier"
6. Photo est uploadée dans le bucket `client-media`
7. Enregistrement créé dans `client_results_photos` avec :
   - `client_id` : ID de la cliente
   - `company_id` : ID du prestataire
   - `service_id` : Service sélectionné
   - `service_name` : Catégorie sélectionnée
   - `show_in_gallery` : `true`
8. Photo apparaît automatiquement dans les 3 emplacements

### Depuis Profil Public (Source 2)

1. Prestataire navigue vers son profil public
2. Va dans l'onglet "Galerie"
3. Clique sur le bouton "+"
4. Sélectionne une photo
5. Modal s'ouvre avec :
   - Prévisualisation de la photo
   - Sélecteur de **Catégorie** (obligatoire)
   - Sélecteur de **Service** (obligatoire, filtré par catégorie)
   - Message d'information sur la publication automatique
6. Clique sur "Publier"
7. Photo est uploadée dans le bucket `client-media`
8. Enregistrement créé dans `client_results_photos` avec :
   - `client_id` : `null` (pas de cliente associée)
   - `company_id` : ID du prestataire
   - `service_id` : Service sélectionné
   - `service_name` : Catégorie sélectionnée
   - `show_in_gallery` : `true`
9. Photo apparaît automatiquement dans les 3 emplacements

## 🎨 Composants Modifiés

### 1. ClientGallery.tsx
**Emplacement** : `src/components/client/ClientGallery.tsx`

**Modifications** :
- Ajout du champ "Catégorie" obligatoire
- Ajout du champ "Service" obligatoire (filtré par catégorie)
- Validation pour empêcher la publication sans ces deux champs
- Utilisation de `photo_url` au lieu de `url`
- Ajout de `show_in_gallery: true` lors de l'insertion

### 2. PublicProfile.tsx
**Emplacement** : `src/pages/PublicProfile.tsx`

**Modifications** :
- Ajout du champ "Catégorie" obligatoire dans le modal d'upload
- Ajout du champ "Service" obligatoire (filtré par catégorie)
- Extraction automatique des catégories depuis les services actifs
- Validation pour empêcher la publication sans ces deux champs
- Affichage du message informatif sur les 3 lieux de publication

**Chargement des photos** :
```typescript
const { data: photosData } = await supabase
  .from('client_results_photos')
  .select('id, photo_url, service_name, created_at')
  .eq('company_id', companyData?.id)
  .eq('show_in_gallery', true)
  .not('service_name', 'is', null)
  .order('created_at', { ascending: false })
  .limit(12);
```

### 3. ClientHome.tsx
**Emplacement** : `src/pages/client/ClientHome.tsx`

**Modifications** :

#### Feed "Pour toi"
```typescript
const { data: clientPhotos } = await supabase
  .from('client_results_photos')
  .select(`
    id,
    photo_url,
    service_name,
    caption,
    created_at,
    company_id,
    likes_count,
    comments_count
  `)
  .eq('show_in_gallery', true)
  .not('service_name', 'is', null)
  .order('created_at', { ascending: false })
  .limit(50);
```

#### Section "Suivies"
```typescript
// 1. Récupérer les prestataires suivis
const { data: followsData } = await supabase
  .from('provider_follows')
  .select('provider_id')
  .eq('client_id', user?.id);

// 2. Récupérer les company_ids correspondants
const { data: companyIds } = await supabase
  .from('company_profiles')
  .select('id')
  .in('user_id', providerUserIds);

// 3. Récupérer les photos de ces prestataires
const { data: contentData } = await supabase
  .from('client_results_photos')
  .select(...)
  .in('company_id', companyIdsList)
  .eq('show_in_gallery', true)
  .not('service_name', 'is', null);
```

## ✅ Règles de Validation

### À l'Upload
1. ✅ Catégorie doit être sélectionnée
2. ✅ Service doit être sélectionné
3. ✅ Les services proposés sont filtrés par la catégorie choisie
4. ✅ Description est optionnelle

### À l'Affichage
1. ✅ `show_in_gallery` doit être `true`
2. ✅ `service_name` ne doit pas être `null`
3. ✅ Pour "Suivies" : vérification dans `provider_follows`

## 🔐 Sécurité

### RLS Policies
Les policies existantes sur `client_results_photos` permettent :
- Aux prestataires de voir et gérer les photos de leur entreprise
- Aux clientes de voir toutes les photos publiques (feed "Pour toi")
- Accès public en lecture pour les profils publics

### Storage
Bucket `client-media` :
- Photos stockées avec le chemin : `{company_id}/gallery-{timestamp}.{ext}`
- Ou : `{client_id}/results/{timestamp}-{random}.{ext}`

## 📝 Messages Utilisateur

### Modal de Publication
Message affiché dans les deux sources :

```
Cette photo sera automatiquement publiée dans :
• Feed "Pour toi" (visible par toutes les clientes)
• Section "Suivis" (pour vos abonnées)
• Votre profil public - Galerie
```

## 🚀 Points Clés

1. **Deux sources** de dépôt, mais une **seule règle** de diffusion
2. **Catégorie ET service** sont obligatoires pour la publication
3. Les catégories proviennent uniquement des `service_type` des services actifs
4. Toutes les photos publiées ont `show_in_gallery = true`
5. Une photo peut exister sans `client_id` (ajoutée depuis profil public)
6. Le système utilise `photo_url` (pas `url`)
7. Les compteurs `likes_count` et `comments_count` sont inclus dans la table

## 🔄 Migration Appliquée

**Fichier** : `fix_client_results_photos_columns.sql`

```sql
-- Renommage url → photo_url
ALTER TABLE client_results_photos RENAME COLUMN url TO photo_url;

-- Ajout show_in_gallery
ALTER TABLE client_results_photos ADD COLUMN show_in_gallery boolean DEFAULT true;
```

## 📊 Schéma Visuel

```
┌─────────────────────────────────────────────────────────────┐
│                    SOURCES DE DÉPÔT                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Source 1: Clients → Galerie → Ses résultats              │
│  Source 2: Profil Public → Galerie → Bouton +             │
│                                                             │
│  Champs obligatoires:                                       │
│  ✓ Catégorie (depuis service_type)                         │
│  ✓ Service (filtré par catégorie)                          │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ client_results_ │
         │     photos      │
         │                 │
         │ • photo_url     │
         │ • service_name  │
         │ • service_id    │
         │ • company_id    │
         │ • show_in_      │
         │   gallery:true  │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│  AFFICHAGE 1    │ │  AFFICHAGE 2    │
│                 │ │                 │
│ Feed "Pour toi" │ │ Section "Suivies│
│                 │ │                 │
│ • Toutes les    │ │ • Seulement     │
│   clientes      │ │   abonnées      │
│ • Toutes les    │ │ • Prestataires  │
│   photos        │ │   suivis        │
└─────────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│  AFFICHAGE 3    │
│                 │
│ Profil Public   │
│ Galerie         │
│                 │
│ • Photos du     │
│   prestataire   │
│ • Visible par   │
│   tous          │
└─────────────────┘
```

## 🎯 Résultat Final

Un système clair, unifié et simple :
- **2 sources** pour déposer
- **1 règle** de diffusion
- **3 emplacements** d'affichage automatiques
- Catégorie et service toujours obligatoires
- Feed cohérent pour toutes les clientes
- Profil public aligné avec le feed client
