# Schéma Fonctionnel - Module Inspirations

## 🎯 Vision globale

```
┌─────────────────────────────────────────────────────────────┐
│                    MODULE INSPIRATIONS                       │
│                   (Logique Pinterest)                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   RÉSEAUX    │   │  MON SALON   │   │     PAR      │
│   SOCIAUX    │   │              │   │ PRESTATION   │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 📱 SOUS-ONGLET 1 : RÉSEAUX SOCIAUX

### Objectif
Moodboards pour contenu Instagram, TikTok, Pinterest

### Structure
```
GROUPES (exemples)
├── 📁 Idées Reels
│   ├── 🖼️ Photo 1 → 🔗 https://instagram.com/...
│   ├── 🖼️ Photo 2 → 🔗 https://tiktok.com/...
│   └── 🖼️ Photo 3 → 🔗 https://instagram.com/...
│
├── 📁 Feed inspiration
│   ├── 🖼️ Photo 1
│   └── 🖼️ Photo 2 → 🔗 lien
│
└── 📁 Avant / Après
    ├── 🖼️ Photo 1
    └── 🖼️ Photo 2
```

### Champs par photo
```
┌──────────────────────────┐
│  🖼️ PHOTO (obligatoire) │
├──────────────────────────┤
│  🔗 Lien (optionnel)     │
│  Ex: Instagram, TikTok   │
└──────────────────────────┘
```

### Cas d'usage
- Collecter des inspirations de contenu
- Sauvegarder des posts qui marchent
- Préparer son calendrier éditorial
- Créer des moodboards thématiques

---

## 🏠 SOUS-ONGLET 2 : MON SALON

### Objectif
Portfolio du salon : ambiance, réalisations, identité visuelle

### Structure
```
GROUPES (exemples)
├── 📁 Réalisations salon
│   ├── 🖼️ Photo 1 → 📝 "Cliente VIP - Résultat parfait"
│   ├── 🖼️ Photo 2
│   └── 🖼️ Photo 3 → 📝 "Pour Instagram"
│
├── 📁 Ambiance salon
│   ├── 🖼️ Photo déco 1 → 📝 "Coin accueil"
│   └── 🖼️ Photo déco 2
│
└── 📁 Avant / Après
    ├── 🖼️ Transformation 1 → 📝 "Cliente ravie, à publier"
    └── 🖼️ Transformation 2
```

### Champs par photo
```
┌──────────────────────────┐
│  🖼️ PHOTO (obligatoire) │
├──────────────────────────┤
│  🔗 Lien (optionnel)     │
├──────────────────────────┤
│  📝 Note libre           │
│  (optionnel)             │
└──────────────────────────┘
```

### Cas d'usage
- Portfolio interne du salon
- Photos pour communication
- Suivi de l'évolution du salon
- Cohérence esthétique

---

## 💅 SOUS-ONGLET 3 : PAR PRESTATION

### Objectif
Inspirations classées par type de service vendu

### Structure
```
GROUPES (exemples)
├── 📁 Ongles
│   ├── 🖼️ Photo 1 → 🏷️ Gel → 📝 "Technique french"
│   ├── 🖼️ Photo 2 → 🏷️ Résine → 🔗 lien tuto
│   └── 🖼️ Photo 3 → 🏷️ Nail art
│
├── 📁 Cils
│   ├── 🖼️ Photo 1 → 🏷️ Volume russe
│   └── 🖼️ Photo 2 → 🏷️ Classic → 📝 "Pour clientes naturelles"
│
└── 📁 Soins visage
    ├── 🖼️ Photo 1 → 🏷️ Anti-âge
    └── 🖼️ Photo 2 → 🏷️ Hydratation
```

### Champs par photo
```
┌──────────────────────────┐
│  🖼️ PHOTO (obligatoire) │
├──────────────────────────┤
│  🏷️ Type de prestation  │
│  (optionnel)             │
│  Ex: Gel, Résine...      │
├──────────────────────────┤
│  🔗 Lien (optionnel)     │
│  Ex: tuto YouTube        │
├──────────────────────────┤
│  📝 Description          │
│  (optionnel)             │
│  Notes techniques        │
└──────────────────────────┘
```

### Cas d'usage
- Montrer des exemples aux clientes
- Références qualité attendue
- Inspirations classées par service
- Base pour devis/propositions

---

## 🔄 Comparaison des 3 onglets

| Critère | Réseaux Sociaux | Mon Salon | Par Prestation |
|---------|-----------------|-----------|----------------|
| **Photo** | ✅ Oui | ✅ Oui | ✅ Oui |
| **Lien externe** | ✅ Oui (Instagram, etc.) | ✅ Oui | ✅ Oui (tuto, etc.) |
| **Note/Description** | ❌ Non | ✅ Oui (note libre) | ✅ Oui (technique) |
| **Type de service** | ❌ Non | ❌ Non | ✅ Oui |
| **Usage principal** | Contenu social | Portfolio salon | Référence prestations |

---

## 🎨 Interface utilisateur

### Vue liste des groupes
```
┌────────────────────────────────────────────────────────┐
│  🌟 Réseaux Sociaux  │  🏠 Mon Salon  │  💅 Par Prestation │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Photo   │  │  Photo   │  │  Photo   │            │
│  │ couverture│  │ couverture│  │ couverture│            │
│  └──────────┘  └──────────┘  └──────────┘            │
│  Idées Reels   Feed         Avant/Après               │
│  📷 12 photos  📷 8 photos  📷 5 photos               │
│                                                         │
│  [+ Nouveau groupe]                                    │
└────────────────────────────────────────────────────────┘
```

### Vue détail d'un groupe
```
┌────────────────────────────────────────────────────────┐
│  ← Idées Reels                                    ✕    │
│  Description du groupe si présente                     │
├────────────────────────────────────────────────────────┤
│  [📤 Glisser-déposer ou cliquer pour ajouter]         │
├────────────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│  │ 🖼️ │ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │                         │
│  └────┘ └────┘ └────┘ └────┘                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│  │ 🖼️ │ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │                         │
│  └────┘ └────┘ └────┘ └────┘                         │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Flux de données

```
1. UTILISATEUR
   ↓
2. Sélectionne un ONGLET (social_media / salon / service)
   ↓
3. App charge les GROUPES de cette catégorie
   ↓
4. Utilisateur clique sur un GROUPE
   ↓
5. App charge les PHOTOS du groupe
   ↓
6. Utilisateur ajoute/supprime des PHOTOS
   ↓
7. Formulaire adapté selon la CATÉGORIE
```

---

## 💡 Logique métier

### Règles de gestion

1. **Un groupe appartient à UNE SEULE catégorie**
   - social_media OU salon OU service
   - Pas de migration entre catégories

2. **Les photos sont liées à UN groupe**
   - Suppression du groupe = suppression des photos
   - Suppression en cascade automatique

3. **Les champs varient selon la catégorie**
   - Interface s'adapte dynamiquement
   - Validation côté client et serveur

4. **Upload multiple autorisé**
   - Plusieurs photos en une fois
   - Mêmes infos appliquées à toutes

5. **Ordre personnalisable**
   - display_order pour les groupes
   - photo_order pour les photos
   - Drag & drop futur

---

## ✅ Points de validation UX

- ✅ L'utilisatrice comprend immédiatement : "Je crée des groupes, j'y mets des photos"
- ✅ Pas de surcharge cognitive : champs adaptés au besoin
- ✅ Interface rapide : pas de formulaire lourd
- ✅ Cohérence visuelle : même base pour les 3 onglets
- ✅ Mobile-friendly : grille responsive, upload adapté
- ✅ Feedback visuel : nombre de photos, photo de couverture
- ✅ Actions claires : ajouter, supprimer, organiser

---

## 🎯 Différenciation claire

| ONGLET | QUOI | POURQUOI | CHAMPS SPÉCIFIQUES |
|--------|------|----------|-------------------|
| **Réseaux Sociaux** | Moodboards contenu | Inspiration posts | Lien uniquement |
| **Mon Salon** | Portfolio interne | Vitrine salon | Note libre |
| **Par Prestation** | Exemples services | Montrer aux clientes | Type prestation |

Cette structure garantit que chaque onglet a un **usage distinct et clair**.
