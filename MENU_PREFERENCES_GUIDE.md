# Guide : Personnalisation du menu et des vues

## Fonctionnalités implémentées

### 1. Gestion des onglets du menu (Paramètres → Onglets)

L'écran de personnalisation permet maintenant de contrôler quels onglets apparaissent dans le menu principal :

#### Onglets disponibles :
- **Tableau de bord** (obligatoire - verrouillé)
- Agenda
- Clientes
- Élèves
- Services
- Transactions
- Stock
- Tâches
- Objectifs
- Contenu
- Profil public
- Inspiration
- Marketing
- Partenariats

#### Comportement :
- **Switchs actifs** : Tous les switchs sont cliquables (sauf Tableau de bord)
- **Mise à jour immédiate** : Le menu se met à jour instantanément
- **Toast de confirmation** : "Onglet affiché" / "Onglet masqué"
- **Redirection automatique** : Si vous masquez l'onglet actif, redirection vers Tableau de bord
- **Persistance** : Les préférences sont sauvegardées en base de données

### 2. Section Réseaux sociaux

Deux options pour personnaliser l'affichage dans le module Contenu :

- **Vue par type de post** : Afficher la vue organisée par type de contenu
- **Calendrier de production** : Afficher le calendrier de production

Ces préférences sont synchronisées avec le module Contenu pour une expérience cohérente.

## Utilisation

### Accéder aux paramètres
1. Cliquer sur "Paramètres" dans le menu latéral
2. Sélectionner l'onglet "Onglets"

### Activer/désactiver un onglet
1. Cliquer sur le switch à côté de l'onglet souhaité
2. Le menu se met à jour automatiquement
3. Un toast confirme l'action

### Personnaliser les vues Réseaux sociaux
1. Faire défiler jusqu'à la section "Réseaux sociaux"
2. Activer/désactiver les vues selon vos besoins
3. Les changements sont sauvegardés instantanément

## Technique

### Base de données
- Table : `menu_preferences`
- Champs :
  - `menu_visibility` (jsonb) : Visibilité de chaque onglet
  - `social_views` (jsonb) : Préférences des vues sociales
- RLS activé pour la sécurité

### Synchronisation
- Les préférences se chargent au démarrage
- Les mises à jour sont diffusées via événements personnalisés
- Le menu latéral et la navigation mobile s'adaptent automatiquement

### Fichiers modifiés
1. `src/components/settings/SocialMediaSettings.tsx` - Interface de gestion
2. `src/lib/useMenuPreferences.ts` - Hook de gestion des préférences
3. `src/components/layout/Sidebar.tsx` - Menu latéral filtré
4. `src/components/layout/BottomNavigation.tsx` - Navigation mobile filtrée

## Notes importantes

- **Tableau de bord** est toujours visible (non désactivable)
- Les préférences sont **par utilisateur**
- En cas d'erreur de sauvegarde, le switch revient à son état précédent
- Les préférences sont chargées automatiquement à chaque connexion
