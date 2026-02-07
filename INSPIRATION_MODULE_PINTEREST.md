# Module Inspirations - Architecture Pinterest

## Vue d'ensemble

Le module Inspirations de Belleya fonctionne comme Pinterest : des **groupes épinglés** contenant des **photos organisées**.

Structure complète avec 3 sous-onglets distincts, chacun adapté à un usage spécifique des pros de la beauté.

---

## 📊 Structure de la base de données

### Table `inspiration_groups`
Groupes/dossiers qui contiennent les photos (comme les boards Pinterest)

```sql
- id (uuid)
- company_id (uuid) → référence à company_profiles
- category (text) → 'social_media' | 'salon' | 'service'
- name (text) → Nom du groupe
- description (text, optionnel) → Description du groupe
- display_order (integer) → Ordre d'affichage
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Table `company_inspirations`
Photos individuelles dans les groupes

```sql
- id (uuid)
- company_id (uuid) → référence à company_profiles
- group_id (uuid) → référence à inspiration_groups
- type (text) → 'social_media' | 'salon' | 'service'
- title (text, optionnel) → Non utilisé dans l'UI actuelle
- description (text, optionnel) → Notes/description selon la catégorie
- image_url (text) → URL de la photo stockée
- link_url (text, optionnel) → Lien externe (Instagram, etc.)
- service_type (text, optionnel) → Type de prestation (pour category='service')
- photo_order (integer) → Ordre dans le groupe
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Bucket Storage
`company-inspirations` - Stockage des images avec accès public en lecture

---

## 🎯 Les 3 sous-onglets

### 1️⃣ RÉSEAUX SOCIAUX (`social_media`)

**Objectif** : Créer des moodboards de contenu pour Instagram / TikTok / Pinterest

**Groupes typiques** :
- "Idées Reels"
- "Feed inspiration"
- "Avant / Après"
- "Stories"

**Champs disponibles par photo** :
- ✅ Photo (obligatoire)
- ✅ Lien (optionnel) - ex: lien Instagram, TikTok
- ❌ Description (non affiché)
- ❌ Service (non applicable)

**Usage** : Stocker, organiser et visualiser du contenu inspiration pour les réseaux sociaux.

---

### 2️⃣ MON SALON (`salon`)

**Objectif** : Centraliser les visuels liés à l'identité et au travail du salon

**Groupes typiques** :
- "Réalisations salon"
- "Ambiance"
- "Avant / Après clientes"
- "Déco & setup"

**Champs disponibles par photo** :
- ✅ Photo (obligatoire)
- ✅ Lien (optionnel)
- ✅ Note libre (optionnel) - annotations personnelles
- ❌ Service (non applicable)

**Usage** : Portfolio interne, vitrine visuelle, cohérence esthétique du salon.

---

### 3️⃣ PAR PRESTATION (`service`)

**Objectif** : Lier inspirations et services vendus

**Groupes typiques** :
- "Ongles"
- "Cils"
- "Soins visage"
- "Coiffure"

**Champs disponibles par photo** :
- ✅ Photo (obligatoire)
- ✅ Lien (optionnel) - ex: lien vers tuto
- ✅ Description (optionnel) - notes techniques
- ✅ Type de prestation (optionnel mais recommandé)

**Usage** : Exemples à montrer aux clientes, références internes pour qualité attendue.

---

## 🎨 Composants React

### `Inspiration.tsx` (Page principale)
- Affiche les 3 onglets
- Liste les groupes par catégorie
- Gestion création de nouveaux groupes
- Responsive mobile-first

### `InspirationGroupCard.tsx`
- Carte d'un groupe avec photo de couverture
- Affiche le nombre de photos
- Menu actions (ouvrir, supprimer)
- Clic pour ouvrir le détail

### `CreateGroupModal.tsx`
- Modal création de groupe
- Champs : nom + description
- Placeholders adaptés selon la catégorie

### `GroupDetailModal.tsx`
- Modal plein écran avec toutes les photos du groupe
- Upload multiple de photos (drag & drop)
- Formulaire adapté selon la catégorie :
  - `social_media` : lien uniquement
  - `salon` : lien + note
  - `service` : lien + description + type de prestation
- Grille de photos avec actions (supprimer, ouvrir lien)

---

## 🔐 Sécurité (RLS)

Toutes les tables ont RLS activé avec les politiques suivantes :
- SELECT : utilisateurs authentifiés voient leurs données company
- INSERT : utilisateurs authentifiés insèrent pour leur company
- UPDATE : utilisateurs authentifiés modifient leurs données
- DELETE : utilisateurs authentifiés suppriment leurs données

Le stockage est public en lecture (photos visibles) mais upload authentifié uniquement.

---

## 📱 UX Mobile-First

- Interface responsive sur tous les écrans
- Drag & drop sur desktop
- Upload fichier classique sur mobile
- Grille adaptative (1 col mobile → 4 cols desktop)
- Bottom padding pour navigation mobile
- Textes et boutons adaptés à la taille d'écran

---

## 🚀 Workflow utilisateur

1. **Créer un groupe** : Clic "Nouveau groupe" → Nom + description → Créer
2. **Ouvrir un groupe** : Clic sur la carte du groupe
3. **Ajouter des photos** : Drag & drop ou upload → Remplir champs selon catégorie → Ajouter
4. **Gérer les photos** : Hover sur photo → Supprimer ou ouvrir lien
5. **Supprimer un groupe** : Menu ⋮ → Supprimer (supprime groupe + toutes photos)

---

## ✅ Avantages du système Pinterest

- **Organisation visuelle** : Groupes clairs, photos faciles à retrouver
- **Flexibilité** : Adapté à 3 usages différents
- **Simplicité** : Pas de surcharge, juste ce qui est nécessaire
- **Scalable** : Illimité en groupes et photos
- **Rapide** : Upload multiple, pas de formulaire lourd
- **Intuitif** : Logique connue (Pinterest-like)

---

## 📈 Améliorations futures possibles

- Réorganisation des photos par drag & drop
- Partage de groupes entre utilisateurs
- Tags sur les photos
- Recherche dans les inspirations
- Import depuis Instagram API
- Export PDF de groupes pour présentation clients
