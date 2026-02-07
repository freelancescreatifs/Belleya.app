# Règles de Publication du Feed Instagram

Ce document détaille les règles implémentées pour le système de publication basé sur date+heure et production dans le feed Instagram.

## 1. Définition du Statut "Publié / Non publié"

### 1.1 Règle Prioritaire : Production avant Date

Le statut d'un contenu dépend de deux facteurs avec **priorité à la production** :

#### Cas 1 : Contenu SANS production définie
Si **AUCUNE** date de production n'est définie (tous les champs `date_script`, `date_shooting`, `date_editing`, `date_scheduling` sont NULL) :
- ✅ **Publié** si `publication_date + publication_time <= now()`
- ❌ **Non publié** si `publication_date + publication_time > now()`

#### Cas 2 : Contenu AVEC production active
Si **AU MOINS UNE** date de production est définie :
- La **production devient prioritaire**
- ❌ **Non publié** si au moins une étape pertinente est incomplète (même si date passée)
- Si toutes les étapes pertinentes sont complétées :
  - ✅ **Publié** si `publication_date + publication_time <= now()`
  - ❌ **Non publié** si `publication_date + publication_time > now()`

### Exemples
Supposons maintenant = 21 janvier 2026 à 15:00

| Publication Date | Publication Time | Production | Étapes Complétées | Statut | Raison |
|-----------------|------------------|------------|-------------------|---------|--------|
| 21 jan 2026 | 14:00 | Non définie | - | ✅ Publié | Pas de production, date+heure passée |
| 21 jan 2026 | 16:00 | Non définie | - | ❌ Non publié | Pas de production, heure future |
| 21 jan 2026 | 14:00 | Active | Oui | ✅ Publié | Production complète, date+heure passée |
| 21 jan 2026 | 14:00 | Active | Non | ❌ Non publié | **Production incomplète (prioritaire)** |
| 21 jan 2026 | 16:00 | Active | Oui | ❌ Non publié | Production complète mais heure future |
| 20 jan 2026 | 10:00 | Active | Non | ❌ Non publié | **Production incomplète (prioritaire)** même si date passée |

## 2. Escalade des Étapes de Production (CASCADE)

### 2.1 Règles de Cascade

Les étapes de production suivent un ordre strict : **Script → Tournage → Montage → Planifié**

#### Cocher une étape (CASCADE BACKWARD)
Quand vous cochez une étape N :
- ✅ Toutes les étapes **AVANT** N sont automatiquement cochées
- Exemple : Cocher "Montage" → "Script" et "Tournage" se cochent automatiquement

#### Décocher une étape (CASCADE FORWARD)
Quand vous décochez une étape N :
- ✅ L'étape N reste décochée
- ✅ Toutes les étapes **APRÈS** N sont automatiquement décochées
- ❌ L'étape N ne se recoche JAMAIS automatiquement
- Exemple : Décocher "Tournage" → "Montage" et "Planifié" se décochent automatiquement

### 2.2 Synchronisation avec les Tâches

Chaque étape de production est liée à une tâche :
- Étape cochée → Tâche marquée comme "Terminée"
- Étape décochée → Tâche marquée comme "À faire"
- Les cascades s'appliquent aussi aux tâches

### 2.3 Optimistic UI

L'interface se met à jour immédiatement (optimistic update) pour une meilleure expérience utilisateur, puis synchronise avec la base de données via la fonction RPC `cascade_production_steps`.

## 3. Switch Statut sur la Carte Jour

### 3.1 Fonctionnalité
Sur la carte du jour (calendrier éditorial vue jour), le badge "Publié / Non publié" est **cliquable** :

#### Clic pour passer à "Publié"
- ✅ Coche **TOUTES** les étapes de production pertinentes (via `cascade_production_steps` avec `p_step='published'`)
- ✅ Marque toutes les tâches correspondantes comme terminées
- ✅ Le statut devient "Publié" (si cohérent avec la date+heure)

#### Clic pour passer à "Non publié"
- ✅ Décoche la **dernière étape** de production (généralement "Planifié")
- ✅ Cascade forward : toutes les étapes après sont décochées
- ✅ Les tâches correspondantes repassent à "À faire"
- ✅ Le statut devient "Non publié"

### 3.2 Respect de la Règle de Priorité
Le switch respecte la règle "production prioritaire" :
- Si vous mettez "Publié" mais que la date est future → reste "Non publié"
- Si vous mettez "Non publié" → production incomplète donc "Non publié" garanti

## 4. Affichage dans le Feed Instagram

### Affichage Visuel
Le feed utilise un **grisage visuel** pour différencier les statuts :
- **Posts publiés** : Opacité réduite (70%), bordure verte, cursor "not-allowed"
- **Posts non publiés** : Pleine opacité, hover ring orange, cursor "move" (déplaçables)
- ❌ **Pas de tags texte** : Le statut est visible uniquement via le style visuel

### Tri du Feed
Le feed applique un **tri prioritaire** :
1. **D'abord** : Tous les posts **publiés** (par ordre de date+heure croissante)
2. **Ensuite** : Tous les posts **non publiés** (par ordre de date+heure croissante)

Ce tri garantit que les posts déjà publiés apparaissent en premier dans le feed, simulant l'ordre réel d'un feed Instagram.

### Filtre d'Affichage
Un bouton toggle permet de :
- **Actif** (vert) : "Posts publiés visibles" → Affiche tous les posts (publiés + non publiés, triés)
- **Inactif** (gris) : "Masquer publiés" → Affiche uniquement les posts non publiés

Par défaut, seuls les posts **non publiés** sont affichés (mode de travail principal).

## 3. Règles de Déplacement (Drag & Drop)

### 3.1 Posts Déplaçables
**Seuls les posts "Non publié" peuvent être déplacés.**

Les posts "Publié" sont :
- Visuellement identifiés (opacité réduite, bordure verte)
- Non déplaçables (drag désactivé)
- Tooltip : "Contenu publié - Non déplaçable (date+heure de publication atteinte)"

### 3.2 Règles de Swap
Lors d'un glisser-déposer d'un post A vers un post B :

#### Règle 1 : Interdiction si Post Publié
- ❌ Si le post A (déplacé) est publié → **Refus**
  - Message : "Impossible de déplacer un contenu déjà publié"
- ❌ Si le post B (cible) est publié → **Refus**
  - Message : "Impossible de déplacer vers un contenu déjà publié"

#### Règle 2 : Interdiction de Déplacement vers le Futur
- ❌ Si la date+heure de B > date+heure de A → **Refus**
  - Message : "Vous ne pouvez pas déplacer un post vers une date plus future. Le feed sert uniquement à réorganiser ou backfill le contenu."

#### Règle 3 : Swap Pur
Si toutes les validations passent :
- ✅ Échange uniquement des `publication_date` et `publication_time` entre A et B
- Aucun autre post n'est affecté
- Les deux posts conservent tous leurs autres attributs

### 3.3 Messages Pendant le Drag
Pendant l'opération de drag, un bandeau orange s'affiche avec :
- **Message principal** : "Les dates des deux posts seront échangées"
- **Règles rappelées** :
  - Seuls les posts "Non publié" peuvent être déplacés
  - Vous ne pouvez pas déplacer vers une date plus future

## 4. Conséquence Importante : Changement Automatique de Statut

### Scénario : Déplacement vers le Passé
Si un post "Non publié" est déplacé (via le calendrier éditorial) vers une date+heure passée :
1. Les dates sont modifiées
2. Le trigger `auto_calculate_is_published` se déclenche
3. Le statut passe automatiquement à **Publié**
4. Le post devient immédiatement **non déplaçable** dans le feed

**Exemple** :
- Post A : 22 jan 2026 16:00 (Non publié, déplaçable)
- Action : Déplacement manuel vers 20 jan 2026 14:00
- Résultat : Post A → Publié, non déplaçable

## 5. Implémentation Technique

### Base de Données
- **Fonction** : `calculate_is_published(content_type, date_script, date_shooting, date_editing, date_scheduling, publication_date, publication_time)`
- **Trigger** : `auto_calculate_is_published` s'exécute avant chaque UPDATE sur `content_calendar`
- **Calcul** : Combine `publication_date + publication_time` et compare avec `now()`

### Frontend
- **Helper** : `/src/lib/publicationHelpers.ts`
  - `canSwapContent()` : Valide les règles de swap
  - `isPublished()` : Détermine le statut (pour référence, la BDD est source de vérité)
- **Composants** :
  - `InstagramFeed.tsx` : Gestion du drag & drop et validations
  - `InstagramFeedCard.tsx` : Affichage des badges et état visuel

## 6. Tests de Validation

### Tests Obligatoires
1. **Statut basé sur date+heure (sans production)**
   - Post sans production + heure passée → Publié ✅
   - Post sans production + heure future → Non publié ✅
   - Post sans production + date passée → Publié ✅
   - Post sans production + date future → Non publié ✅

2. **Statut avec production (priorité production)**
   - Post avec production incomplète + date passée → **Non publié** ✅ (priorité production)
   - Post avec production complète + date passée → Publié ✅
   - Post avec production complète + date future → Non publié ✅
   - Post avec production incomplète + date future → Non publié ✅

3. **Cascades de production**
   - Cocher "Montage" → "Script" et "Tournage" cochés automatiquement ✅
   - Décocher "Tournage" → "Montage" et "Planifié" décochés automatiquement ✅
   - Décocher puis re-décocher → Pas de recocher automatique ✅
   - Tâches synchronisées avec étapes ✅

4. **Switch statut carte jour**
   - Clic "Non publié" → passe à "Publié" → toutes étapes cochées ✅
   - Clic "Publié" → passe à "Non publié" → dernière étape décochée ✅
   - Actualisation après switch → statut cohérent ✅

5. **Drag & Drop Feed**
   - Déplacer un post publié → Interdit ✅
   - Déplacer vers un post publié → Interdit ✅
   - Déplacer vers une date plus future → Interdit ✅
   - Swap valide entre deux posts non publiés (vers passé/présent) → OK ✅

6. **Tri du Feed**
   - Posts publiés apparaissent en premier ✅
   - Posts non publiés apparaissent après ✅
   - Tri par date+heure dans chaque groupe ✅

7. **Changement de Statut Automatique**
   - Post non publié déplacé vers le passé (calendrier) → Devient publié si production complète ✅
   - Post avec production incomplète → Reste non publié même si date passée ✅

## 7. Messages UI (Wording Exact)

### Carte Jour - Badge Statut (Cliquable)
- ✅ "Publié" (vert avec CheckCircle, hover pour indiquer cliquable)
- 📅 "Non publié" (gris avec Calendar, hover pour indiquer cliquable)
- Tooltip : "Cliquer pour passer en Non publié" / "Cliquer pour marquer comme Publié"

### Feed Instagram - Pas de Badge Texte
- Grisage visuel uniquement (voir section 4.1)
- Tooltip sur carte : "Contenu publié - Non déplaçable (date+heure de publication atteinte)" / "Glisser pour réorganiser"

### Bouton Toggle Feed
- Actif : "Posts publiés visibles"
- Inactif : "Masquer publiés"
- Tooltip actif : "Masquer les posts publiés (date+heure atteinte)"
- Tooltip inactif : "Afficher aussi les posts publiés"

### Tooltips sur Cartes
- Post publié : "Contenu publié - Non déplaçable (date+heure de publication atteinte)"
- Post non publié : "Glisser pour réorganiser"

### Messages d'Erreur
1. "Impossible de déplacer un contenu déjà publié"
2. "Impossible de déplacer vers un contenu déjà publié"
3. "Vous ne pouvez pas déplacer un post vers une date plus future. Le feed sert uniquement à réorganiser ou backfill le contenu."
4. "Erreur lors de l'échange des dates" (erreur technique)

### Bandeau de Drag
- "Les dates des deux posts seront échangées"
- "Seuls les posts 'Non publié' peuvent être déplacés"
- "Vous ne pouvez pas déplacer vers une date plus future"

## 8. Philosophie du Système

### Priorité Production
Le système privilégie la **qualité de production** sur la planification :
- Un post avec production incomplète reste "Non publié" même si sa date est passée
- Cela empêche la publication accidentelle de contenu non finalisé
- La production doit être complétée avant que le statut ne dépende de la date

### Feed Instagram
Le feed Instagram est conçu pour :
- ✅ **Réorganiser** les posts non publiés
- ✅ **Backfill** le contenu (combler des trous dans le passé)
- ✅ **Visualiser** l'historique publié (en lecture seule, grisé)
- ❌ **Pas pour** pousser des posts plus loin dans le futur

### Workflows Clairs
- **Calendrier éditorial (vue jour)** : Planification, production, switch de statut
- **Feed Instagram** : Visualisation réaliste, réorganisation non publiés, grisage publiés
- **Cascades automatiques** : Cohérence des étapes de production garantie
