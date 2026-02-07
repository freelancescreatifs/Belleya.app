# Intégration des vues Réseaux sociaux

## Vue d'ensemble

Les switchs "Réseaux sociaux" dans Paramètres → Onglets sont maintenant **complètement connectés** à l'onglet Contenu. Ils contrôlent l'affichage de deux vues dédiées aux réseaux sociaux.

## Fonctionnalités implémentées

### 1. Nouvel onglet "Réseaux sociaux" dans Contenu

Un nouvel onglet principal "Réseaux sociaux" a été ajouté dans le module Contenu, qui apparaît entre "Studio de contenu" et "Statistiques".

**Conditions d'affichage :**
- L'onglet est visible seulement si au moins une des deux vues est activée dans les paramètres
- Si les deux vues sont désactivées, l'onglet disparaît complètement

### 2. Deux sous-vues configurables

#### Vue par type de post
- **Icône :** Layers
- **Description :** Organisez vos contenus réseaux sociaux par format
- **Composant :** KanbanView avec filtres par plateforme sociale
- **Activation :** Switch "Vue par type de post" dans Paramètres → Onglets

**Fonctionnalités :**
- Organisation des contenus par type (Reel, Story, Post, etc.)
- Filtres par réseau social (Instagram, Facebook, TikTok, YouTube, LinkedIn, Twitter)
- Vue Kanban interactive
- Création et édition de contenus

#### Calendrier de production
- **Icône :** Clapperboard
- **Description :** Suivez l'avancement de vos contenus étape par étape
- **Composant :** ProductionCalendar
- **Activation :** Switch "Calendrier de production" dans Paramètres → Onglets

**Fonctionnalités :**
- Suivi des étapes de production (Script, Tournage, Montage, Planification)
- Visualisation temporelle des contenus
- Gestion des dates de production

### 3. Gestion intelligente des vues

#### Basculement automatique
- Si une seule vue est activée, elle s'affiche automatiquement (pas de sous-onglets)
- Si les deux vues sont activées, des sous-onglets permettent de basculer entre elles
- Si aucune vue n'est activée, un état vide s'affiche avec un lien vers les paramètres

#### Redirection automatique
- Si l'utilisateur désactive toutes les vues sociales alors qu'il est sur cet onglet
- Redirection automatique vers l'onglet "Calendrier"

#### État vide informatif
```
┌────────────────────────────────────┐
│   🔔 Aucune vue activée            │
│                                    │
│   Active une vue dans              │
│   Paramètres → Onglets pour voir   │
│   ton contenu ici.                 │
│                                    │
│   [ Aller aux paramètres ]         │
└────────────────────────────────────┘
```

### 4. Synchronisation en temps réel

**Système d'événements personnalisés :**
- Quand les switchs changent dans Paramètres, un événement `menuPreferencesUpdated` est émis
- Le hook `useMenuPreferences` écoute cet événement
- L'onglet Contenu se met à jour instantanément sans rechargement

**Persistance :**
- Les préférences sont stockées dans `menu_preferences.social_views`
- Synchronisation automatique avec `content_view_preferences`
- Chargement automatique au démarrage de l'application

## Architecture technique

### Hook étendu : useMenuPreferences

Le hook a été étendu pour gérer les vues sociales :

```typescript
interface SocialViews {
  viewByPostType: boolean;
  productionCalendar: boolean;
}

// Retourne maintenant :
{
  menuVisibility: MenuVisibility;
  socialViews: SocialViews;
  loading: boolean;
}
```

**Fonctionnalités :**
- Chargement des préférences depuis `menu_preferences`
- Écoute des événements `menuPreferencesUpdated`
- Mise à jour en temps réel de `socialViews`

### Modifications de Content.tsx

#### Nouvelles variables d'état
```typescript
const [view, setView] = useState<'calendar' | 'studio' | 'stats' | 'events' | 'social'>('calendar');
const [socialSubView, setSocialSubView] = useState<'post_type' | 'production'>('post_type');
```

#### Hook d'intégration
```typescript
const { socialViews } = useMenuPreferences(user?.id);
```

#### Logique de redirection
```typescript
useEffect(() => {
  if (view === 'social') {
    // Basculement automatique si une seule vue est active
    if (socialViews.viewByPostType && !socialViews.productionCalendar) {
      setSocialSubView('post_type');
    } else if (!socialViews.viewByPostType && socialViews.productionCalendar) {
      setSocialSubView('production');
    }

    // Redirection si aucune vue n'est active
    if (!socialViews.viewByPostType && !socialViews.productionCalendar) {
      setView('calendar');
    }
  }
}, [view, socialViews]);
```

## Flux de données

```
Paramètres → Onglets
    ↓
Toggle switch "Vue par type de post"
    ↓
Sauvegarde dans menu_preferences.social_views
    ↓
Synchronisation avec content_view_preferences
    ↓
Événement menuPreferencesUpdated émis
    ↓
Hook useMenuPreferences mis à jour
    ↓
Component Content re-rendu
    ↓
Vue affichée/masquée selon la config
```

## Expérience utilisateur

### Scénario 1 : Activer une vue
1. Aller dans Paramètres → Onglets
2. Activer "Vue par type de post"
3. Toast : "Vue activée"
4. Aller dans Contenu
5. Nouvel onglet "Réseaux sociaux" visible
6. Cliquer dessus → Vue par type de post s'affiche

### Scénario 2 : Activer les deux vues
1. Activer "Vue par type de post" ET "Calendrier de production"
2. Dans Contenu → Réseaux sociaux
3. Deux sous-onglets apparaissent pour basculer entre les vues

### Scénario 3 : Désactiver toutes les vues
1. Être sur Contenu → Réseaux sociaux
2. Aller dans Paramètres → Désactiver les deux vues
3. Retour automatique vers Contenu → Calendrier
4. L'onglet "Réseaux sociaux" disparaît du menu

### Scénario 4 : Aucune vue activée
1. Toutes les vues sociales désactivées
2. Forcer la navigation vers l'onglet Social (via URL)
3. État vide informatif s'affiche
4. Bouton "Aller aux paramètres" pour activer les vues

## Fichiers modifiés

### 1. src/lib/useMenuPreferences.ts
- Ajout de l'interface `SocialViews`
- Extension du hook pour charger `social_views`
- Écoute des mises à jour de `socialViews`
- Retour de `socialViews` en plus de `menuVisibility`

### 2. src/pages/Content.tsx
- Import de `useMenuPreferences` et icône `Instagram`
- Ajout de la vue 'social' au type union
- Ajout de `socialSubView` pour gérer les sous-vues
- Utilisation du hook pour récupérer `socialViews`
- Logique de redirection dans useEffect
- Nouveau bouton "Réseaux sociaux" dans l'interface
- Sous-onglets conditionnels pour les vues sociales
- Trois sections de rendu :
  - Vue par type de post (avec filtres)
  - Calendrier de production
  - État vide si aucune vue n'est active

### 3. src/components/settings/SocialMediaSettings.tsx
*(Déjà modifié précédemment)*
- Gestion des switchs actifs
- Sauvegarde dans DB
- Synchronisation avec content_view_preferences

## Base de données

Les préférences sont stockées dans deux tables pour maintenir la cohérence :

### menu_preferences
```json
{
  "social_views": {
    "viewByPostType": true,
    "productionCalendar": true
  }
}
```

### content_view_preferences
```sql
social_by_post_type_enabled: boolean
social_by_production_enabled: boolean
```

La synchronisation est bidirectionnelle lors de la sauvegarde.

## Tests suggérés

1. **Activation/désactivation des vues**
   - Vérifier l'apparition/disparition de l'onglet
   - Tester les sous-onglets quand les deux sont actives

2. **Redirection automatique**
   - Être sur Réseaux sociaux
   - Désactiver toutes les vues
   - Vérifier la redirection vers Calendrier

3. **État vide**
   - Désactiver toutes les vues
   - Forcer la navigation vers #content avec view=social
   - Vérifier l'affichage de l'état vide

4. **Persistance**
   - Activer une vue
   - Actualiser la page
   - Vérifier que la configuration est conservée

5. **Synchronisation temps réel**
   - Ouvrir deux onglets
   - Changer les préférences dans l'un
   - Vérifier la mise à jour dans l'autre

## Limitations et notes

1. Les vues utilisent les composants existants (KanbanView et ProductionCalendar)
2. Les filtres par plateforme sont partagés entre "Studio → Colonnes" et "Social → Vue par type"
3. La redirection se fait toujours vers "Calendrier" (pas vers la dernière vue active)
4. L'état vide redirige vers la page Paramètres via hash navigation

## Améliorations futures possibles

1. Mémoriser la dernière vue active pour y rediriger
2. Permettre la réorganisation de l'ordre des vues
3. Ajouter d'autres vues sociales (Analytics, Planification, etc.)
4. Personnaliser l'état vide avec des suggestions de contenu
5. Ajouter des préférences de filtres par défaut
