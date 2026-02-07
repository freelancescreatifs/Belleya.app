# Fonctionnalité Sous-projets

## Vue d'ensemble

La fonctionnalité Sous-projets permet d'organiser les tâches au sein d'un projet principal en créant des catégories plus fines avec :
- Des tags automatiques
- Des filtres visuels
- Une identification par couleur
- Une meilleure organisation des tâches

## Architecture de Base de Données

### Nouvelle Table : `subprojects`

```sql
CREATE TABLE subprojects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES company_profiles(id),
  project_id uuid REFERENCES projects(id),
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  tag_prefix text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes principales :**
- `project_id` : Lie le sous-projet à un projet parent
- `name` : Nom du sous-projet (ex: "Design", "Développement", "Marketing")
- `color` : Couleur d'identification (hex code)
- `tag_prefix` : Préfixe pour la génération automatique de tags

### Modification Table : `tasks`

Ajout de la colonne `subproject_id` :
```sql
ALTER TABLE tasks ADD COLUMN subproject_id uuid REFERENCES subprojects(id);
```

## Génération Automatique de Tags

### Trigger `auto_generate_subproject_tags`

Lorsqu'une tâche est assignée à un sous-projet, un tag est automatiquement généré et ajouté :

**Règles de génération :**
1. Si `tag_prefix` est défini → utilise ce préfixe
2. Sinon → utilise le nom du sous-projet en minuscules avec tirets

**Exemples :**
- Sous-projet "Design" avec `tag_prefix = "design"` → Tag : `design`
- Sous-projet "Développement Frontend" sans prefix → Tag : `développement-frontend`

**Comportement :**
- Les tags sont ajoutés automatiquement lors de l'insertion/mise à jour d'une tâche
- Les doublons sont évités
- Les tags existants (comme `content:xxx`) sont préservés

## Interface Utilisateur

### 1. Gestionnaire de Sous-projets (`SubprojectManager`)

**Emplacement :** Dans la carte projet étendue (ProjectCard)

**Fonctionnalités :**
- Création de sous-projets avec :
  - Nom (obligatoire)
  - Description (optionnel)
  - Tag personnalisé (optionnel)
  - Couleur (8 couleurs prédéfinies)
- Modification des sous-projets existants
- Suppression de sous-projets (les tâches associées ne sont pas supprimées)
- Liste visuelle avec badges colorés

**Palette de couleurs par défaut :**
```javascript
['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
```

### 2. Sélecteur de Sous-projet (`SubprojectSelector`)

**Emplacement :** Dans les formulaires de création/modification de tâche

**Fonctionnalités :**
- Apparaît uniquement si un projet est sélectionné
- Liste déroulante des sous-projets du projet parent
- Aperçu visuel avec badge coloré
- Génère automatiquement le tag lors de l'assignation

**Comportement :**
- Si le projet change, le sous-projet est réinitialisé
- Le champ est optionnel (les tâches peuvent ne pas avoir de sous-projet)

### 3. Badge de Sous-projet (`SubprojectBadge`)

**Emplacement :** Affiché sur chaque tâche dans ProjectCard

**Apparence :**
- Badge coloré avec le nom du sous-projet
- Petit point blanc décoratif
- Couleur de fond personnalisée selon le sous-projet

### 4. Système de Filtres

**Emplacement :** Dans la carte projet étendue, au-dessus de la liste des tâches

**Fonctionnalités :**
- Bouton "Tous" pour afficher toutes les tâches
- Boutons filtrés par sous-projet avec la couleur correspondante
- Comptage dynamique des tâches
- Filtrage instantané au clic

**Design :**
- Filtres en forme de pilules arrondies
- Couleur semi-transparente quand non sélectionné
- Couleur pleine avec texte blanc quand sélectionné
- Animation de transition fluide

## Flux Utilisateur

### Création d'un Sous-projet

1. Aller dans la page "Tâches" → Onglet "Projets"
2. Développer un projet en cliquant sur "Voir les tâches"
3. Dans la section "Sous-projets", cliquer sur "Ajouter"
4. Remplir le formulaire :
   - Nom (ex: "Design UI")
   - Description (ex: "Toutes les tâches de design d'interface")
   - Tag (ex: "design-ui")
   - Choisir une couleur
5. Cliquer sur "Créer"

### Assignation d'une Tâche à un Sous-projet

**Méthode 1 : Nouvelle tâche**
1. Créer une nouvelle tâche
2. Sélectionner un projet
3. Le sélecteur de sous-projet apparaît automatiquement
4. Choisir un sous-projet dans la liste
5. Enregistrer la tâche
   → Le tag est automatiquement généré

**Méthode 2 : Tâche existante**
1. Modifier une tâche existante
2. Sélectionner ou changer le sous-projet
3. Enregistrer
   → Le tag est mis à jour automatiquement

### Filtrage par Sous-projet

1. Dans un projet étendu, observer la barre de filtres
2. Cliquer sur un sous-projet pour filtrer les tâches
3. Cliquer sur "Tous" pour réafficher toutes les tâches

## Cas d'Usage

### Projet de Développement d'Application

**Projet :** "Application Mobile Fitness"

**Sous-projets :**
- Design (couleur: bleu)
  - Tag: `design`
  - Tâches: Maquettes, Prototype, Charte graphique

- Développement Frontend (couleur: vert)
  - Tag: `frontend`
  - Tâches: Composants React, Pages, Navigation

- Développement Backend (couleur: orange)
  - Tag: `backend`
  - Tâches: API, Base de données, Authentification

- Testing (couleur: violet)
  - Tag: `testing`
  - Tâches: Tests unitaires, Tests E2E, QA

**Avantages :**
- Vision claire de l'avancement par domaine
- Filtrage rapide pour se concentrer sur un aspect
- Tags automatiques pour recherche et organisation
- Identification visuelle immédiate avec couleurs

### Projet de Marketing

**Projet :** "Campagne Lancement Produit"

**Sous-projets :**
- Réseaux Sociaux (couleur: rose)
  - Tag: `social`
  - Tâches: Posts Instagram, Campagnes Facebook, Stories

- Contenu (couleur: cyan)
  - Tag: `contenu`
  - Tâches: Articles blog, Vidéos, Infographies

- Relations Publiques (couleur: rouge)
  - Tag: `pr`
  - Tâches: Communiqués, Interviews, Partenariats

### Projet de Formation

**Projet :** "Formation Professionnelle"

**Sous-projets :**
- Module 1 (couleur: bleu)
- Module 2 (couleur: vert)
- Module 3 (couleur: orange)
- Exercices Pratiques (couleur: violet)

## Sécurité

### Row Level Security (RLS)

Toutes les politiques RLS garantissent que :
- Les utilisateurs ne voient que leurs propres sous-projets
- Les modifications sont limitées aux sous-projets de l'utilisateur
- Les sous-projets sont automatiquement liés à l'utilisateur créateur

**Politiques appliquées :**
```sql
CREATE POLICY "Users can view own subprojects"
  ON subprojects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subprojects"
  ON subprojects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subprojects"
  ON subprojects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subprojects"
  ON subprojects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Fichiers Créés/Modifiés

### Nouveaux Fichiers

1. **Migration :** `supabase/migrations/create_subprojects_table.sql`
   - Création table `subprojects`
   - Ajout colonne `subproject_id` à `tasks`
   - Triggers pour génération automatique de tags
   - RLS policies

2. **Composants :**
   - `src/components/tasks/SubprojectManager.tsx` : Gestion CRUD des sous-projets
   - `src/components/tasks/SubprojectSelector.tsx` : Sélecteur dans formulaires
   - `src/components/tasks/SubprojectBadge.tsx` : Badge d'affichage

### Fichiers Modifiés

1. **src/components/tasks/ProjectCard.tsx**
   - Import des nouveaux composants
   - Ajout état pour sous-projets et filtres
   - Intégration SubprojectManager
   - Système de filtres visuels
   - Affichage badges sur tâches
   - Chargement dynamique des sous-projets

2. **src/pages/Tasks.tsx**
   - Import SubprojectSelector
   - Ajout `subproject_id` au formData
   - Intégration dans formulaires de tâche
   - Passage companyId à ProjectCard
   - Reset du sous-projet lors du changement de projet

## Avantages de la Fonctionnalité

### Organisation
- Structuration hiérarchique des tâches
- Catégorisation fine au sein d'un projet
- Meilleure visibilité sur les différents axes de travail

### Productivité
- Filtrage rapide pour se concentrer sur un aspect
- Réduction du bruit visuel
- Navigation intuitive entre les différentes parties du projet

### Collaboration
- Identification claire des domaines de responsabilité
- Tags automatiques facilitant la recherche
- Couleurs pour communication visuelle rapide

### Flexibilité
- Sous-projets optionnels (on peut créer des tâches sans)
- Tags personnalisables
- Couleurs configurables
- Suppression sans perte de données

## Limitations et Notes

1. **Cascade de suppression :**
   - La suppression d'un sous-projet ne supprime PAS les tâches associées
   - Les tâches verront simplement leur `subproject_id` mis à NULL
   - Les tags générés restent sur les tâches

2. **Performance :**
   - Le chargement des sous-projets se fait uniquement quand le projet est étendu
   - Optimisation avec index sur `project_id` et `subproject_id`

3. **Tags :**
   - Les tags de contenu (`content:xxx`) sont préservés et ne sont pas affectés
   - Le trigger évite les doublons de tags

4. **Compatibilité :**
   - Rétrocompatible : les projets et tâches existants continuent de fonctionner
   - Les tâches sans sous-projet s'affichent normalement

## Améliorations Futures Possibles

1. **Statistiques par sous-projet :**
   - Pourcentage de complétion par sous-projet
   - Graphiques de répartition des tâches
   - Vue d'ensemble du projet avec breakdown

2. **Glisser-déposer :**
   - Réassignation de tâche par drag & drop
   - Réordonnancement des sous-projets

3. **Templates :**
   - Créer des ensembles de sous-projets prédéfinis
   - Duplication de structure entre projets

4. **Filtres avancés :**
   - Filtrer par multiple sous-projets
   - Combiner filtres (sous-projet + priorité + statut)

5. **Vue Kanban par sous-projet :**
   - Colonnes représentant les sous-projets
   - Glisser-déposer entre colonnes

## Conclusion

La fonctionnalité Sous-projets enrichit considérablement la gestion de projets en permettant une organisation granulaire tout en restant simple et intuitive. Les tags automatiques, les filtres visuels et l'identification par couleur créent une expérience utilisateur fluide et productive.
