# Intégration des vues Réseaux sociaux - Version finale

## Vue d'ensemble

Les switchs "Réseaux sociaux" dans Paramètres → Onglets contrôlent maintenant l'affichage de deux vues **intégrées** dans les onglets existants du module Contenu.

## Structure finale

### Onglet "Calendrier"
**Sous-onglets disponibles :**
1. **Calendrier éditorial** (toujours visible si activé dans les préférences)
2. **Calendrier de production** (contrôlé par le switch "Calendrier de production")

### Onglet "Studio de contenu"
**Sous-onglets disponibles :**
1. **Vue Colonnes** (si activé dans les préférences)
2. **Vue Lignes** (si activé dans les préférences)
3. **Vue par type de post** (contrôlé par le switch "Vue par type de post")

## Fonctionnalités implémentées

### 1. Calendrier de production dans "Calendrier"

**Activation :** Switch "Calendrier de production" dans Paramètres → Onglets

**Comportement :**
- Quand activé : Un sous-onglet "Calendrier de production" apparaît dans l'onglet Calendrier
- Quand désactivé : Le sous-onglet disparaît
- Si les deux sous-onglets (éditorial + production) sont visibles, l'utilisateur peut basculer entre eux
- Si un seul est visible, il s'affiche automatiquement sans sous-onglets

**Composant :** ProductionCalendar
**Icône du sous-onglet :** Clapperboard

### 2. Vue par type de post dans "Studio"

**Activation :** Switch "Vue par type de post" dans Paramètres → Onglets

**Comportement :**
- Quand activé : Un sous-onglet "Vue par type de post" apparaît dans l'onglet Studio
- Quand désactivé : Le sous-onglet disparaît
- Affichage conditionnel selon le nombre de sous-onglets actifs
- Utilise les mêmes filtres par réseau social que les autres vues

**Composant :** KanbanView (avec viewMode="type")
**Icône du sous-onglet :** Instagram

## Modifications techniques

### 1. Types et état

```typescript
// Suppression de 'social' du type de vue principale
const [view, setView] = useState<'calendar' | 'studio' | 'stats' | 'events'>('calendar');

// Ajout de 'social_post_type' aux sous-vues de Studio
const [studioSubView, setStudioSubView] = useState<'columns' | 'lines' | 'social_post_type'>('columns');
```

### 2. Logique de basculement automatique

```typescript
useEffect(() => {
  if (view === 'calendar') {
    const availableCalendarViews = [];
    if (viewPreferences.editorial_calendar_enabled) availableCalendarViews.push('editorial');
    if (socialViews.productionCalendar) availableCalendarViews.push('production');

    if (availableCalendarViews.length === 1) {
      setCalendarSubView(availableCalendarViews[0]);
    }
  }

  if (view === 'studio') {
    const availableStudioViews = [];
    if (viewPreferences.type_view_enabled) availableStudioViews.push('columns');
    if (viewPreferences.table_view_enabled) availableStudioViews.push('lines');
    if (socialViews.viewByPostType) availableStudioViews.push('social_post_type');

    if (availableStudioViews.length === 1) {
      setStudioSubView(availableStudioViews[0]);
    }
  }
}, [view, viewPreferences, socialViews]);
```

### 3. Affichage conditionnel des sous-onglets

#### Calendrier
```typescript
{view === 'calendar' && (viewPreferences.editorial_calendar_enabled && socialViews.productionCalendar) && (
  <div className="flex gap-2 pl-0 sm:pl-4 sm:border-l-2 border-orange-300">
    {viewPreferences.editorial_calendar_enabled && (
      <button onClick={() => setCalendarSubView('editorial')}>
        Calendrier éditorial
      </button>
    )}
    {socialViews.productionCalendar && (
      <button onClick={() => setCalendarSubView('production')}>
        Calendrier de production
      </button>
    )}
  </div>
)}
```

#### Studio
```typescript
{view === 'studio' && (viewPreferences.type_view_enabled || viewPreferences.table_view_enabled || socialViews.viewByPostType) && (
  <div className="flex gap-2 pl-0 sm:pl-4 sm:border-l-2 border-orange-300">
    {viewPreferences.type_view_enabled && (
      <button onClick={() => setStudioSubView('columns')}>
        Vue Colonnes
      </button>
    )}
    {viewPreferences.table_view_enabled && (
      <button onClick={() => setStudioSubView('lines')}>
        Vue Lignes
      </button>
    )}
    {socialViews.viewByPostType && (
      <button onClick={() => setStudioSubView('social_post_type')}>
        Vue par type de post
      </button>
    )}
  </div>
)}
```

### 4. Rendu des vues

#### Calendrier de production
```typescript
{view === 'calendar' && calendarSubView === 'production' && socialViews.productionCalendar && (
  <ProductionCalendar
    onContentEdit={(contentId) => {
      const content = contents.find(c => c.id === contentId);
      if (content) {
        handleContentEdit(content);
      }
    }}
  />
)}
```

#### Vue par type de post
```typescript
{view === 'studio' && studioSubView === 'social_post_type' && socialViews.viewByPostType && (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">Vue par type de post</h2>
      <p className="text-sm text-gray-600 mt-1">Organisez vos contenus réseaux sociaux par format</p>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Filtrer par réseau social</label>
      {/* Filtres par plateforme */}
    </div>

    <KanbanView
      contents={contents.filter(c => {
        if (c.status === 'idea') return false;
        if (platformFilter.length === 0) return true;
        const contentPlatforms = c.platform.split(',');
        return contentPlatforms.some(p => platformFilter.includes(p));
      })}
      pillars={pillars}
      viewMode="type"
      onContentEdit={handleContentEdit}
      onContentDelete={handleContentDelete}
      onContentUpdated={handleKanbanContentUpdate}
      onContentCreate={openContentForm}
    />
  </div>
)}
```

## Expérience utilisateur

### Scénario 1 : Activer "Calendrier de production"
1. Aller dans Paramètres → Onglets
2. Activer le switch "Calendrier de production"
3. Toast : "Vue activée"
4. Aller dans Contenu → Calendrier
5. Un nouveau sous-onglet "Calendrier de production" apparaît
6. Cliquer dessus pour voir le calendrier de production

### Scénario 2 : Activer "Vue par type de post"
1. Aller dans Paramètres → Onglets
2. Activer le switch "Vue par type de post"
3. Toast : "Vue activée"
4. Aller dans Contenu → Studio de contenu
5. Un nouveau sous-onglet "Vue par type de post" apparaît
6. Cliquer dessus pour voir la vue organisée par format

### Scénario 3 : Une seule vue active
1. Désactiver toutes les vues sauf "Calendrier de production"
2. Aller dans Contenu → Calendrier
3. La vue production s'affiche automatiquement sans sous-onglets
4. Si on réactive "Calendrier éditorial", les sous-onglets réapparaissent

### Scénario 4 : Désactiver toutes les vues d'un onglet
1. Dans Studio, désactiver "Vue Colonnes", "Vue Lignes" et "Vue par type de post"
2. L'onglet Studio devient inaccessible (comme configuré dans content_view_preferences)

## Changements par rapport à la version précédente

### ❌ Supprimé
- Onglet principal "Réseaux sociaux"
- Vue 'social' dans le type union des vues
- État socialSubView
- Bouton "Réseaux sociaux" dans la navigation principale
- Sections de rendu pour view === 'social'
- État vide pour les vues sociales

### ✅ Ajouté
- Sous-onglet "Calendrier de production" dans Calendrier
- Sous-onglet "Vue par type de post" dans Studio
- Logique de basculement automatique des sous-vues
- Affichage conditionnel des sous-onglets selon socialViews

## Base de données

Les préférences restent stockées dans `menu_preferences.social_views` :

```json
{
  "social_views": {
    "viewByPostType": true,
    "productionCalendar": true
  }
}
```

Synchronisation maintenue avec `content_view_preferences` :
- `social_by_post_type_enabled`
- `social_by_production_enabled`

## Fichiers modifiés

### src/pages/Content.tsx
**Modifications principales :**
1. Suppression du type 'social' de l'union de vues
2. Ajout de 'social_post_type' aux sous-vues de Studio
3. Suppression de socialSubView
4. Modification de la logique useEffect pour gérer les sous-vues
5. Suppression du bouton "Réseaux sociaux"
6. Modification des conditions d'affichage des sous-onglets Calendar et Studio
7. Modification du rendu du calendrier de production (utilise socialViews)
8. Ajout du rendu de la vue par type de post dans Studio
9. Suppression de toutes les sections view === 'social'

### Autres fichiers
- `src/lib/useMenuPreferences.ts` (déjà modifié - inchangé)
- `src/components/settings/SocialMediaSettings.tsx` (déjà modifié - inchangé)

## Tests suggérés

1. **Calendrier de production**
   - Activer/désactiver le switch
   - Vérifier l'apparition/disparition du sous-onglet
   - Tester le basculement avec calendrier éditorial

2. **Vue par type de post**
   - Activer/désactiver le switch
   - Vérifier l'apparition/disparition du sous-onglet
   - Tester les filtres par réseau social

3. **Basculement automatique**
   - Activer une seule vue dans Calendar → Vérifier l'affichage direct
   - Activer les deux → Vérifier les sous-onglets
   - Idem pour Studio

4. **Persistance**
   - Activer une vue, actualiser → Vérifier conservation
   - Tester la synchronisation temps réel

## Avantages de cette approche

1. **Interface cohérente** : Les vues s'intègrent naturellement dans les onglets existants
2. **Moins de navigation** : Pas besoin d'un onglet supplémentaire
3. **Logique simplifiée** : Réutilisation des composants et patterns existants
4. **Flexible** : Facile d'ajouter d'autres vues dans les onglets existants
5. **Intuitive** : Les utilisateurs trouvent les fonctionnalités là où elles sont attendues

## Limitations

1. Les filtres par plateforme sont partagés entre différentes vues de Studio
2. Impossible d'avoir le calendrier de production sans aucune autre vue de Calendar
3. Les préférences de vue sont globales (pas par projet ou contexte)
