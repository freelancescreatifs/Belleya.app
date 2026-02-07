# Corrections Studio de Contenu : Labels et terminologie

## Modifications apportées

### 0. Corrections de terminologie (nouvelles)

#### a) Changement "Écriture" → "Script"

**Problème** : Dans plusieurs endroits de l'application, l'étape de production "Script" était affichée comme "Écriture", ce qui créait une incohérence terminologique.

**Fichiers modifiés** :
- `src/lib/productionStepsHelpers.ts` - Ligne 167
- `src/components/content/ContentForm.tsx` - Ligne 79

**Changements** :
```typescript
// productionStepsHelpers.ts
export const stepLabelMap: Record<string, string> = {
  script: 'Script',        // Avant: 'Écriture'
  shooting: 'Tournage',
  editing: 'Montage',
  subtitles: 'Sous-titres',
  validation: 'Validation',
  scheduling: 'Planifié'
};

// ContentForm.tsx - STATUSES
const STATUSES = [
  { value: 'idea', label: 'Idée' },
  { value: 'script', label: 'Script' },    // Avant: 'Écriture'
  { value: 'shooting', label: 'Tournage' },
  { value: 'editing', label: 'Montage' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
];
```

**Impact** : Partout où l'étape "Script" est affichée (calendrier, formulaire, tâches), le label est maintenant cohérent : "Script" au lieu de "Écriture".

#### b) Changement "Réseau" → "Réseaux sociaux"

**Problème** : Dans le tableau du Studio de contenu, l'en-tête de colonne affichait "Réseau" au singulier, ce qui manquait de clarté.

**Fichier modifié** : `src/components/content/ContentTable.tsx` - Ligne 316

**Changement** :
```tsx
// Avant
<button>
  Réseau
  <ChevronDown className="w-3 h-3" />
</button>

// Après
<button>
  Réseaux sociaux
  <ChevronDown className="w-3 h-3" />
</button>
```

**Impact** : L'en-tête de colonne de filtre dans la vue tableau affiche maintenant "Réseaux sociaux" au lieu de "Réseau", ce qui est plus explicite et cohérent avec le reste de l'interface.

---

### 1. Ordre des onglets : Calendrier avant Studio de contenu

**Problème** : L'onglet "Studio de contenu" apparaissait avant "Calendrier" dans le menu principal.

**Solution** : Réorganisation de l'ordre d'affichage des onglets.

**Fichiers modifiés** : `src/pages/Content.tsx`

#### Changements effectués :

**a) Vue par défaut au chargement**
```typescript
// Avant
const [view, setView] = useState<'calendar' | 'studio' | 'stats' | 'events'>('studio');

// Après
const [view, setView] = useState<'calendar' | 'studio' | 'stats' | 'events'>('calendar');
```

**b) Ordre des boutons dans l'interface**
```tsx
// Avant
{viewPreferences.studio_enabled && <button>Studio de contenu</button>}
{viewPreferences.calendar_enabled && <button>Calendrier</button>}

// Après
{viewPreferences.calendar_enabled && <button>Calendrier</button>}
{viewPreferences.studio_enabled && <button>Studio de contenu</button>}
```

**c) Priorité dans la logique de sélection**
```typescript
// Avant
if (prefs.studio_enabled) availableViews.push('studio');
if (prefs.calendar_enabled) availableViews.push('calendar');

// Après
if (prefs.calendar_enabled) availableViews.push('calendar');
if (prefs.studio_enabled) availableViews.push('studio');
```

**Résultat** :
- Le Calendrier s'affiche en premier au chargement de la page
- L'onglet Calendrier apparaît avant Studio de contenu dans le menu
- L'ordre logique : Calendrier → Studio de contenu → Statistiques → Événements

---

### 2. Vue Jour : Les étapes de production restent toujours visibles

**Problème** : Dans la vue "Jour" du calendrier éditorial, quand on décochait une étape de production, elle disparaissait complètement de l'affichage dans la section "Toutes les étapes de production".

**Comportement attendu** : Les étapes doivent toujours rester affichées, décocher une étape doit uniquement changer son statut (terminée → à faire) mais la laisser visible.

**Fichier modifié** : `src/lib/productionStepsHelpers.ts`

#### Analyse du problème

Dans la fonction `getProductionSteps()`, la logique était :

```typescript
// AVANT - Logique défaillante
for (const step of stepsConfig) {
  const isCompleted = completedStepKeys.includes(step.key);

  if (step.date) {
    // Étape avec date : toujours ajoutée
    steps.push({ ...step, /* calculs */ });
  } else if (isCompleted) {
    // Étape SANS date MAIS complétée : ajoutée
    steps.push({ ...step, isCompleted: true });
  }
  // ❌ Étape SANS date ET non complétée : PAS ajoutée du tout !
}
```

**Le problème** : Une étape sans date ET non complétée n'était jamais ajoutée au tableau `steps`, donc elle disparaissait de l'affichage.

**Scénario de bug** :
1. Un post a une étape "Script" sans date assignée
2. L'utilisateur coche l'étape → elle apparaît (car `isCompleted = true`)
3. L'utilisateur décoche l'étape → elle disparaît (car `isCompleted = false` ET pas de date)

#### Solution implémentée

```typescript
// APRÈS - Logique corrigée
for (const step of stepsConfig) {
  const isCompleted = completedStepKeys.includes(step.key);

  if (step.date) {
    // Étape avec date : calcul normal des délais
    const stepDate = new Date(step.date);
    const todayDate = new Date(today);
    const diffTime = stepDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    steps.push({
      ...step,
      stepDate: step.date,
      diffDays,
      isOverdue: !isCompleted && diffDays < 0,
      isToday: !isCompleted && diffDays === 0,
      isPast: isCompleted || diffDays < 0,
      isCompleted
    });
  } else {
    // ✅ Étape SANS date : TOUJOURS ajoutée, quel que soit son statut
    steps.push({
      ...step,
      stepDate: undefined,
      diffDays: 999,              // Valeur élevée pour tri à la fin
      isOverdue: false,           // Pas de retard si pas de date
      isToday: false,             // Pas "aujourd'hui" si pas de date
      isPast: isCompleted,        // "Passée" uniquement si complétée
      isCompleted                 // Statut réel (coché/décoché)
    });
  }
}
```

#### Comportement après correction

**Toutes les étapes pertinentes sont TOUJOURS visibles** :

| Type de contenu | Étapes affichées |
|----------------|------------------|
| Post | Script, Planifié |
| Story | Script, Planifié |
| Carrousel | Script, Montage, Planifié |
| Reel / Vidéo | Script, Tournage, Montage, Planifié |
| Live | Script, Planifié |

**Comportement des checkboxes** :
- ✅ Cocher une étape = marque comme terminée (reste visible, fond vert)
- ✅ Décocher une étape = marque comme à faire (reste visible, fond blanc/rouge selon retard)
- ✅ Les étapes restent visibles même sans date assignée
- ✅ Les étapes sans date apparaissent à la fin de la liste (diffDays: 999)

**Tri des étapes** :
1. Étapes complétées d'abord (fond vert, opacité réduite)
2. Puis étapes non complétées, triées par date
3. Puis étapes sans date à la fin

---

## Impact utilisateur

### Avant les corrections

**Navigation** :
- Arrivée sur "Studio de contenu" par défaut
- Nécessité de cliquer sur "Calendrier" pour y accéder
- Confusion sur la hiérarchie des outils

**Gestion des étapes** :
- Décocher une étape = elle disparaît
- Impossibilité de voir toutes les étapes si elles n'ont pas de date
- Perte de visibilité sur le workflow complet

### Après les corrections

**Navigation** :
- Arrivée directe sur "Calendrier" (outil principal)
- Ordre logique et cohérent des onglets
- Vue immédiate des publications planifiées

**Gestion des étapes** :
- ✅ Toutes les étapes structurelles toujours visibles
- ✅ Checkbox = change uniquement l'état (à faire / terminé)
- ✅ Visibilité complète du workflow de production
- ✅ Pas de perte d'information en décochant

---

## Séparation conceptuelle claire

### Section "Toutes les étapes de production"
- Vue **structurelle** et **stable**
- Affiche TOUTES les étapes pertinentes pour le type de contenu
- Ne dépend PAS de filtres
- Les checkboxes indiquent uniquement le statut (terminé/à faire)
- **Principe** : Les étapes font partie de la structure du contenu, elles ne disparaissent jamais

### Section "Tâches" (ailleurs dans l'interface)
- Vue **filtrable** et **dynamique**
- Peut être filtrée (à faire / terminées / toutes)
- Dépend des préférences utilisateur
- **Principe** : Les tâches sont des actions ponctuelles, elles peuvent être masquées par filtrage

---

## Tests recommandés

### Test 1 : Ordre des onglets
1. Se déconnecter et reconnecter
2. Aller dans "Contenu & Réseaux Sociaux"
3. ✅ Vérifier que la vue "Calendrier" est sélectionnée par défaut
4. ✅ Vérifier que l'onglet "Calendrier" apparaît avant "Studio de contenu"

### Test 2 : Étapes toujours visibles (avec date)
1. Aller dans Calendrier → Vue Jour
2. Sélectionner un jour avec un post ayant des dates d'étapes
3. Développer le post (cliquer pour voir les étapes)
4. ✅ Toutes les étapes pertinentes sont visibles
5. Cocher une étape
6. ✅ Elle devient verte avec ligne barrée
7. Décocher la même étape
8. ✅ Elle redevient blanche/rouge mais RESTE visible

### Test 3 : Étapes toujours visibles (sans date)
1. Créer ou trouver un post de type "Reel" sans dates assignées
2. Aller dans Vue Jour du calendrier
3. Développer ce post
4. ✅ Les 4 étapes sont visibles (Script, Tournage, Montage, Planifié)
5. Cocher "Script"
6. ✅ L'étape Script devient verte
7. Décocher "Script"
8. ✅ L'étape Script redevient blanche mais **RESTE visible**

### Test 4 : Étapes pertinentes par type
1. Créer un post de type "Post" simple
2. Développer dans Vue Jour
3. ✅ Seulement 2 étapes visibles : Script et Planifié
4. Créer un post de type "Carrousel"
5. ✅ 3 étapes visibles : Script, Montage, Planifié
6. Créer un post de type "Reel"
7. ✅ 4 étapes visibles : Script, Tournage, Montage, Planifié

---

## Fichiers modifiés - Résumé

### 1. src/lib/productionStepsHelpers.ts
**Modifications** :
- Ligne 167 : Label changé de `'Écriture'` à `'Script'` dans stepLabelMap
- Lignes 95-105 : Remplacement du `else if (isCompleted)` par un `else` inconditionnel
- Ajout de `diffDays: 999` pour les étapes sans date (tri à la fin)
- Conservation de `isCompleted` quel que soit le statut

**Impact** :
- Terminologie cohérente "Script" dans toute l'application
- Toutes les étapes pertinentes restent visibles, qu'elles aient une date ou non, qu'elles soient cochées ou décochées

### 2. src/components/content/ContentForm.tsx
**Modifications** :
- Ligne 79 : Label dans STATUSES changé de `'Écriture'` à `'Script'`

**Impact** : Le sélecteur de statut dans le formulaire affiche maintenant "Script" au lieu de "Écriture"

### 3. src/components/content/ContentTable.tsx
**Modifications** :
- Ligne 316 : En-tête de colonne changé de `'Réseau'` à `'Réseaux sociaux'`

**Impact** : L'en-tête de la colonne de filtre des plateformes est plus explicite et cohérent

### 4. src/pages/Content.tsx
**Modifications** :
- Ligne 79 : Vue par défaut changée de `'studio'` à `'calendar'`
- Lignes 177-178 : Ordre de priorité inversé (calendar avant studio)
- Lignes 393-422 : Ordre des boutons inversé dans le JSX

**Impact** : Le Calendrier s'affiche en premier et apparaît avant le Studio de contenu dans la navigation

---

## Logique technique détaillée

### Fonction getProductionSteps() - Avant

```typescript
// ❌ PROBLÈME : Les étapes sans date ET non complétées disparaissent
if (step.date) {
  // OK : Étape avec date → toujours ajoutée
  steps.push(/* ... */);
} else if (isCompleted) {
  // OK : Étape complétée → ajoutée
  steps.push(/* ... */);
}
// MANQUE : Cas "pas de date ET non complété" → pas ajouté !
```

### Fonction getProductionSteps() - Après

```typescript
// ✅ SOLUTION : Toutes les étapes sont ajoutées
if (step.date) {
  // Cas 1 : Étape avec date (cochée ou non) → calculs de délai
  steps.push({
    stepDate: step.date,
    diffDays: /* calculé */,
    isCompleted: isCompleted
  });
} else {
  // Cas 2 : Étape sans date (cochée ou non) → valeurs par défaut
  steps.push({
    stepDate: undefined,
    diffDays: 999,
    isCompleted: isCompleted
  });
}
```

### Valeurs pour étapes sans date

| Champ | Valeur | Raison |
|-------|--------|--------|
| `stepDate` | `undefined` | Pas de date assignée |
| `diffDays` | `999` | Valeur élevée pour tri à la fin |
| `isOverdue` | `false` | Impossible d'être en retard sans date |
| `isToday` | `false` | Impossible d'être aujourd'hui sans date |
| `isPast` | `isCompleted` | Passée uniquement si cochée |
| `isCompleted` | `true/false` | Statut réel de la checkbox |

---

## Comportement UX final

### Section "Toutes les étapes de production"

```
┌─────────────────────────────────────────────┐
│ 📅 Toutes les étapes de production         │
├─────────────────────────────────────────────┤
│ ✅ ✍️ Script              (terminé)        │
│ ☐  🎥 Tournage            (à faire)        │
│ ☐  ✂️ Montage             (à faire)        │
│ ☐  📅 Planifié            (à faire)        │
└─────────────────────────────────────────────┘
```

**Actions** :
- Cliquer sur une checkbox vide → devient cochée, fond vert
- Cliquer sur une checkbox cochée → devient vide, fond blanc
- **L'étape reste TOUJOURS visible dans les deux cas**

### Indicateurs visuels

| État | Fond | Bordure | Texte | Opacité |
|------|------|---------|-------|---------|
| Terminé | Vert (`bg-green-50`) | Vert (`border-green-200`) | Barré (`line-through`) | 60% |
| À faire (normal) | Blanc (`bg-white`) | Gris (`border-gray-200`) | Normal | 100% |
| En retard | Rouge (`bg-red-50`) | Rouge (`border-red-200`) | Normal + badge "Retard" | 100% |

---

## Conclusion

Les corrections apportées améliorent significativement l'expérience utilisateur :

1. **Terminologie "Script"** : Cohérence du vocabulaire (Script au lieu d'Écriture)
2. **Label "Réseaux sociaux"** : Clarté améliorée dans le tableau (Réseaux sociaux au lieu de Réseau)
3. **Ordre des onglets** : Navigation plus intuitive avec le Calendrier en premier
4. **Étapes toujours visibles** : Stabilité de l'interface et visibilité complète du workflow

**Principes clés** :
- Utiliser une terminologie cohérente et claire dans toute l'interface
- Les étapes de production font partie de la structure du contenu, elles ne doivent jamais disparaître
- Seul l'état des étapes (terminé/à faire) change, jamais leur visibilité

**Build** : ✅ Réussi sans erreur (1,7 Mo JS, 129 Ko CSS)
