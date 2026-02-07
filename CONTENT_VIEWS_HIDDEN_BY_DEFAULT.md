# Vues de Contenu Cachées par Défaut

## Modifications Appliquées

Par défaut, les vues suivantes sont maintenant **cachées** dans le module Contenu :

1. **Calendrier de production** - Vue permettant de suivre l'avancement des contenus (script → tournage → montage → planification)
2. **Vue par type de post** - Vue organisant les contenus par type (Reels, Posts, Stories, etc.)

## Vues Visibles par Défaut

Les vues suivantes restent **visibles** par défaut :

### Dans l'onglet "Calendrier"
- ✅ **Calendrier éditorial** - Planification des publications avec le feed Instagram en aperçu

### Dans l'onglet "Studio"
- ✅ **Vue Lignes** (Tableau) - Liste détaillée de tous les contenus

## Comment Activer les Vues Cachées

Pour activer le Calendrier de production ou la Vue par type de post :

1. Allez dans **Contenu**
2. Cliquez sur l'icône **Paramètres** (⚙️) en haut à droite
3. Dans la section "Vues disponibles", activez :
   - **Calendrier de production** pour voir l'avancement de la production
   - **Vue par type de post** pour organiser par format (Reels, Stories, etc.)
4. Cliquez sur **Enregistrer**

Les onglets apparaîtront immédiatement dans le module Contenu.

## Raison de ces Changements

Ces vues avancées étaient affichées par défaut, ce qui pouvait :
- Surcharger l'interface pour les nouveaux utilisateurs
- Créer de la confusion avec trop d'options visibles

En les cachant par défaut, l'interface est plus simple et épurée. Les utilisateurs avancés peuvent facilement les activer via les paramètres.

## Impact sur les Utilisateurs Existants

⚠️ **IMPORTANT** : Cette modification s'applique à **tous les utilisateurs**, y compris ceux déjà inscrits.

Si vous utilisiez ces vues, il vous suffit de les réactiver via les paramètres (voir section ci-dessus).

## Vues Disponibles - Récapitulatif

### Onglet "Calendrier"
| Vue | Visible par défaut | Fonction |
|-----|-------------------|----------|
| Calendrier éditorial | ✅ Oui | Planification des publications |
| Calendrier de production | ❌ Non | Suivi de production (script → montage) |

### Onglet "Studio"
| Vue | Visible par défaut | Fonction |
|-----|-------------------|----------|
| Vue Colonnes (par type) | ❌ Non | Organisation par format de contenu |
| Vue Lignes (tableau) | ✅ Oui | Liste détaillée de tous les contenus |
| Vue par type de post (social) | ❌ Non | Vue spéciale réseaux sociaux |

## Configuration Technique

Les préférences sont stockées dans deux tables :
- `content_view_preferences` - Pour les vues principales
- `menu_preferences.social_views` - Pour les vues sociales avancées

Les defaults ont été mis à jour :
- `production_calendar_enabled: false`
- `type_view_enabled: false`
- `social_views.productionCalendar: false`
- `social_views.viewByPostType: false`
