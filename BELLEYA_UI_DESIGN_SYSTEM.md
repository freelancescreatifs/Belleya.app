# Belleya UI/UX Design System

Guide complet du système de design Belleya - Interface premium, féminine et lisible pour professionnelles de la beauté.

---

## 🎨 PALETTE DE COULEURS

### Couleurs Principales (Interface Pro)

```css
--belleya-powder: #eea09e    /* Rose poudré - doux, élégant */
--belleya-medium: #d17488    /* Rose moyen - équilibré */
--belleya-bright: #db58a2    /* Rose vif - énergique */
--belleya-deep: #c43586      /* Rose foncé - profond */
--belleya-vivid: #ee3879     /* Rose éclatant - dynamique */
--belleya-primary: #e61d8f   /* BOUTON PRIMAIRE - action principale */
```

### Échelle Complète (Tailwind)

```javascript
belleya: {
  'powder': '#eea09e',
  'medium': '#d17488',
  'bright': '#db58a2',
  'deep': '#c43586',
  'vivid': '#ee3879',
  'primary': '#e61d8f',  // CTA principal
  50: '#fef5f5',         // Très clair
  100: '#fde8e8',        // Clair
  200: '#fbd5d6',        // Léger
  300: '#f8b5b8',        // Doux
  400: '#f38890',        // Moyen-clair
  500: '#ee3879',        // Vivid
  600: '#e61d8f',        // Primary
  700: '#c43586',        // Deep
  800: '#a52d6f',        // Foncé
  900: '#882761',        // Très foncé
}
```

---

## 🌈 DÉGRADÉS PRÉ-DÉFINIS

### Dégradés Principaux

```css
/* Bouton primaire - Actions principales */
bg-gradient-primary
→ linear-gradient(135deg, #ee3879 0%, #e61d8f 100%)

/* Authentification - Login client ET pro (identiques) */
bg-gradient-auth
→ linear-gradient(135deg, #eea09e 0%, #db58a2 50%, #c43586 100%)

/* Navigation principale - Onglets actifs, menu principal */
bg-gradient-main
→ linear-gradient(135deg, #eea09e 0%, #d17488 100%)

/* Dégradé vif - Highlights, accents */
bg-gradient-bright
→ linear-gradient(135deg, #db58a2 0%, #ee3879 100%)

/* Dégradé profond - Éléments importants */
bg-gradient-deep
→ linear-gradient(135deg, #c43586 0%, #db58a2 100%)
```

### Dégradés Secondaires

```css
/* Dégradé doux - Backgrounds, états hover */
bg-gradient-soft
→ linear-gradient(135deg, #fef5f5 0%, #fde8e8 100%)

/* Onglets principaux - Filtres niveau 1 */
bg-gradient-tab
→ linear-gradient(135deg, #eea09e 0%, #d17488 50%, #db58a2 100%)

/* Sous-onglets - Filtres niveau 2 */
bg-gradient-subtab
→ linear-gradient(135deg, #fef5f5 0%, #fbd5d6 100%)
```

---

## 🔐 LOGIN - UNIFICATION CLIENT & PRO

### Règle Absolue

Les écrans de login client et pro sont **strictement identiques visuellement**.

```jsx
// ✅ MÊME DESIGN pour client ET pro
<div className="bg-gradient-to-br from-belleya-50 via-white to-belleya-100">
  {/* Titre avec dégradé unifié */}
  <h1 className="bg-gradient-auth bg-clip-text text-transparent">
    {role === 'client' ? 'Espace Cliente' : 'Espace Pro'}
  </h1>

  {/* Boutons avec même style */}
  <button className="bg-gradient-auth text-white">
    Connexion / Inscription
  </button>

  {/* Bouton primaire unifié */}
  <button className="bg-gradient-primary text-white">
    Se connecter
  </button>
</div>
```

### Caractéristiques Communes

- **Background** : `from-belleya-50 via-white to-belleya-100`
- **Titre** : `bg-gradient-auth` avec `text-transparent`
- **Boutons toggle** : `bg-gradient-auth` (actif) / `bg-gradient-soft` (inactif)
- **Bouton principal** : `bg-gradient-primary`
- **Focus inputs** : `focus:ring-belleya-primary`
- **Borders** : `border-belleya-200/30`

---

## 💅 INTERFACE PRO - HIÉRARCHIE VISUELLE

### Principe de Base

La hiérarchie visuelle doit être **immédiatement perceptible sans lire le texte**.

```
ONGLETS PRINCIPAUX (Niveau 1)
└─ Couleurs affirmées
└─ Dégradés visibles
└─ Shadow-md
└─ Font-medium/semibold

SOUS-FILTRES (Niveau 2)
└─ Teintes plus claires
└─ Dégradés subtils
└─ Shadow-sm
└─ Font-normal
```

### Exemples Concrets

#### Navigation Principale (Sidebar Desktop)

```jsx
// ✅ Onglet actif - Hiérarchie forte
<button className="bg-gradient-main text-white font-medium shadow-md">
  <Icon />
  <span>Clientes</span>
</button>

// État normal - Hiérarchie secondaire
<button className="text-gray-600 hover:bg-gradient-soft hover:text-belleya-deep">
  <Icon />
  <span>Agenda</span>
</button>
```

#### Onglets Principaux (Tabs)

```jsx
// ✅ Filtres principaux - Visuellement dominants
<button className={`
  ${isActive
    ? 'bg-gradient-tab text-white shadow-lg'
    : 'bg-gradient-soft text-belleya-deep hover:shadow-md'
  }
`}>
  Réseaux Sociaux
</button>
```

#### Sous-Filtres (Sub-tabs)

```jsx
// ✅ Sous-filtres - Visuellement secondaires
<button className={`
  ${isActive
    ? 'bg-gradient-subtab text-belleya-deep border-2 border-belleya-300'
    : 'bg-white text-gray-600 hover:bg-belleya-50'
  }
`}>
  Posts
</button>
```

---

## 🔘 BOUTONS - GUIDELINES

### Bouton Primaire (CTA Principal)

**Utilisation** : Actions principales uniquement
- Soumettre formulaire
- Confirmer action importante
- Créer / Ajouter élément principal

```jsx
// ✅ Bouton primaire
<button className="bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-xl transition-all shadow-lg transform hover:scale-[1.02]">
  Enregistrer
</button>
```

### Bouton Secondaire

**Utilisation** : Actions secondaires, annulation

```jsx
<button className="border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:border-belleya-300 hover:shadow-md">
  Annuler
</button>
```

### Bouton Danger

**Utilisation** : Suppression, actions destructives

```jsx
<button className="bg-red-500 text-white py-3 rounded-xl hover:bg-red-600">
  Supprimer
</button>
```

### États des Boutons

```jsx
// Disabled
disabled:opacity-50 disabled:cursor-not-allowed

// Loading
{loading ? 'Chargement...' : 'Confirmer'}

// Hover
hover:shadow-xl hover:scale-[1.02]
```

---

## 📐 COMPOSANTS UI

### Cards

```jsx
// Card standard
<div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
  {/* Contenu */}
</div>

// Card avec dégradé (highlight)
<div className="bg-gradient-soft rounded-xl border border-belleya-200 p-6">
  {/* Contenu */}
</div>
```

### Inputs

```jsx
<input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-transparent transition-all" />
```

### Badges

```jsx
// Badge principal
<span className="px-3 py-1 bg-gradient-main text-white text-xs rounded-full font-medium">
  Nouveau
</span>

// Badge secondaire
<span className="px-3 py-1 bg-gradient-soft text-belleya-deep text-xs rounded-full font-medium">
  En cours
</span>
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```javascript
// Tailwind breakpoints
xs: '375px'   // Mobile small
sm: '640px'   // Mobile
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

### Navigation Mobile

```jsx
// Bottom Navigation - Client
<nav className="fixed bottom-0">
  <button className={isActive ? 'text-belleya-primary' : 'text-gray-400'}>
    <Icon />
    <span className="text-xs">Accueil</span>
  </button>
</nav>

// Bottom Navigation - Pro
<nav className="lg:hidden fixed bottom-0">
  {/* Mêmes couleurs que client */}
</nav>
```

---

## 🎯 EXEMPLES D'APPLICATION

### Page Inspiration (3 onglets)

```jsx
// ✅ Onglets principaux (niveau 1) - Affirmés
<button className={`
  ${activeTab === 'social_media'
    ? 'border-belleya-primary text-belleya-primary bg-gradient-soft'
    : 'border-transparent text-gray-600 hover:bg-gray-50'
  }
  px-6 py-4 border-b-2 font-medium
`}>
  Réseaux Sociaux
</button>

// Groupes (cartes) - Hiérarchie visuelle
<div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg">
  {/* Photo de couverture */}
  <div className="bg-gradient-to-br from-gray-100 to-gray-200">
    <img />
  </div>
</div>
```

### Page Clients (avec filtres)

```jsx
// ✅ Filtres principaux - Forte hiérarchie
<button className={`
  ${filter === 'active'
    ? 'bg-gradient-main text-white shadow-md'
    : 'bg-gradient-soft text-belleya-deep'
  }
  px-4 py-2 rounded-xl
`}>
  Actives
</button>

// ✅ Sous-filtres - Hiérarchie secondaire
<button className={`
  ${subFilter === 'recent'
    ? 'bg-gradient-subtab text-belleya-deep border border-belleya-300'
    : 'bg-white text-gray-600'
  }
  px-3 py-1.5 rounded-lg text-sm
`}>
  Récentes
</button>
```

---

## ✅ CHECKLIST DESIGN

### Pour Chaque Nouveau Composant

- [ ] Utilise la palette Belleya (pas de couleurs custom)
- [ ] Hiérarchie visuelle claire (principal vs secondaire)
- [ ] Bouton primaire = `bg-gradient-primary` uniquement
- [ ] États hover/focus bien définis
- [ ] Responsive mobile-first
- [ ] Dégradés cohérents avec le système
- [ ] Textes lisibles sur tous les backgrounds
- [ ] Transitions fluides (transition-all)
- [ ] Shadows appropriées (sm, md, lg, xl)
- [ ] Border-radius cohérents (lg, xl, 2xl)

---

## 🚫 À ÉVITER

- ❌ Créer de nouveaux dégradés non documentés
- ❌ Utiliser `bg-rose-*` ou `bg-pink-*` de Tailwind
- ❌ Différencier visuellement login client et pro
- ❌ Mettre `bg-gradient-primary` partout
- ❌ Même hiérarchie visuelle pour onglets et sous-filtres
- ❌ Oublier les états hover/focus
- ❌ Négliger le responsive
- ❌ Texts illisibles sur backgrounds colorés

---

## 📈 ÉVOLUTION & MAINTENANCE

### Ajout d'une Nouvelle Couleur

1. Vérifier qu'elle s'intègre à la palette existante
2. L'ajouter dans `tailwind.config.js`
3. Créer un dégradé si nécessaire
4. Documenter l'usage dans ce guide
5. Tester sur mobile et desktop

### Ajout d'un Nouveau Composant

1. Respecter la hiérarchie visuelle établie
2. Utiliser les dégradés prédéfinis
3. Ajouter un exemple dans ce guide
4. Tester la lisibilité
5. Valider le responsive

---

## 🎨 PHILOSOPHIE DESIGN

**Belleya = Premium + Féminin + Lisible**

- **Premium** : Dégradés doux, shadows subtiles, transitions fluides
- **Féminin** : Palette rose chaleureuse, formes arrondies, espacements généreux
- **Lisible** : Hiérarchie claire, contrastes suffisants, textes bien dimensionnés

**Objectif** : Une interface professionnelle où les utilisatrices comprennent immédiatement la hiérarchie et les actions possibles, sans effort cognitif.
