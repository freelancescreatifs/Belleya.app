# Comportement des Étapes de Production

Ce document détaille le comportement des étapes de production après les corrections du 21 janvier 2026.

## Problèmes Corrigés

### Avant
- ❌ Cocher une étape remplaçait la date par "aujourd'hui" (écrasait les dates existantes)
- ❌ Décochage ne fonctionnait pas correctement
- ❌ Dates de production modifiées involontairement

### Après
- ✅ Cocher une étape préserve la date existante
- ✅ Décochage fonctionne avec cascade forward
- ✅ Dates stables et prévisibles

## Règles de Fonctionnement

### 1. Toggle Manuel d'une Étape (Checkbox dans le Calendrier)

#### Cocher une étape
Quand vous cochez manuellement une étape de production :

**Cascade Backward**
- L'étape cliquée + toutes les étapes AVANT sont cochées
- Exemple : Cocher "Montage" → "Script" et "Tournage" sont aussi cochés

**Gestion des Dates**
- ✅ **Si la date existe déjà** → Elle est **PRÉSERVÉE** (pas de modification)
- ✅ **Si la date est NULL** → Elle est mise à "aujourd'hui"
- Cette logique garantit que vous ne perdez jamais vos dates de production planifiées

**Synchronisation Tâches**
- Les tâches correspondantes sont marquées comme "Terminées"
- La date de dernière complétion (`last_completed_date`) est mise à jour

#### Décocher une étape
Quand vous décochez manuellement une étape de production :

**Cascade Forward**
- L'étape cliquée + toutes les étapes APRÈS sont décochées
- Exemple : Décocher "Tournage" → "Montage" et "Planifié" sont aussi décochés
- ⚠️ L'étape que vous décochez ne se recoche JAMAIS automatiquement

**Gestion des Dates**
- ✅ Les dates sont mises à **NULL** (étape non complétée)
- Les dates des étapes AVANT restent intactes

**Synchronisation Tâches**
- Les tâches correspondantes repassent à "À faire"
- Les dates de complétion sont effacées

### 2. Switch "Publié / Non publié" (Carte Jour)

Le bouton "Publié/Non publié" sur la carte du jour a un comportement spécial :

#### Clic pour passer à "Publié"
- ✅ Coche **TOUTES** les étapes pertinentes
- ✅ **Force les dates à "aujourd'hui"** pour garantir cohérence
- ✅ Marque toutes les tâches comme terminées
- 🎯 But : Marquer le contenu comme entièrement complété et publié

#### Clic pour passer à "Non publié"
- ✅ Décoche **TOUTES** les étapes pertinentes
- ✅ Met toutes les dates à **NULL**
- ✅ Remet toutes les tâches à "À faire"
- 🎯 But : Réinitialiser complètement le workflow de production

### 3. Différence Clé : Toggle vs Switch

| Action | Toggle Manuel Étape | Switch Publié/Non Publié |
|--------|-------------------|------------------------|
| **Modifie dates existantes** | ❌ Non (préserve) | ✅ Oui (force today) |
| **Cascade** | Backward ou Forward | Tout ou rien |
| **Usage** | Gestion fine de prod | Action rapide globale |

## Exemples de Scénarios

### Scénario 1 : Planning Anticipé
```
Situation initiale :
- Script planifié pour le 25 janvier (date_script = 25/01)
- Tournage planifié pour le 28 janvier (date_shooting = 28/01)
- Toutes les étapes décochées

Action : Je coche "Script" le 21 janvier

Résultat :
✅ date_script reste à 25/01 (PRÉSERVÉE)
✅ Checkbox "Script" cochée
✅ Tâche "Script" marquée terminée
```

### Scénario 2 : Complétion sans Date
```
Situation initiale :
- Aucune date définie (tous NULL)
- Toutes les étapes décochées

Action : Je coche "Tournage" le 21 janvier

Résultat :
✅ date_script = 21/01 (cascade backward, date NULL → today)
✅ date_shooting = 21/01 (étape cochée, date NULL → today)
✅ Checkboxes "Script" et "Tournage" cochées
✅ Tâches correspondantes terminées
```

### Scénario 3 : Annulation d'une Étape
```
Situation initiale :
- Script fait (date_script = 20/01)
- Tournage fait (date_shooting = 21/01)
- Montage fait (date_editing = 22/01)
- Toutes cochées

Action : Je décoche "Tournage"

Résultat :
✅ date_script = 20/01 (conservée, étape avant)
✅ date_shooting = NULL (décochée)
✅ date_editing = NULL (cascade forward)
✅ date_scheduling = NULL (cascade forward)
✅ Checkboxes "Tournage", "Montage", "Planifié" décochées
✅ Tâches correspondantes à "À faire"
```

### Scénario 4 : Switch Publié
```
Situation initiale :
- Script (date_script = 18/01)
- Tournage pas fait (date_shooting = NULL)
- Contenu "Non publié"

Action : Je clique sur "Non publié" → "Publié"

Résultat :
✅ date_script = 21/01 (ÉCRASÉE à today)
✅ date_shooting = 21/01 (FORCÉE à today)
✅ date_editing = 21/01 (FORCÉE à today)
✅ date_scheduling = 21/01 (FORCÉE à today)
✅ Toutes les tâches terminées
✅ Statut "Publié" (si date publication ≤ now)
```

## Recommandations d'Usage

### Pour un Workflow Précis
1. ✅ Définissez les dates de production dans le formulaire d'édition
2. ✅ Utilisez les checkboxes pour marquer les étapes complétées
3. ✅ Les dates planifiées seront préservées

### Pour une Publication Rapide
1. ✅ Utilisez le switch "Publié/Non publié" sur la carte jour
2. ✅ Toutes les étapes seront marquées complètes avec date = today
3. ✅ Idéal pour du contenu créé "à la volée"

### Pour Annuler/Recommencer
1. ✅ Décochez l'étape à refaire
2. ✅ Cascade forward décochera automatiquement les étapes suivantes
3. ✅ Replanifiez les dates si nécessaire

## Architecture Technique

### Fonction RPC : `cascade_production_steps`

**Paramètres**
- `p_content_id` : UUID du contenu
- `p_step` : Nom de l'étape ('script', 'shooting', 'editing', 'scheduling', 'published')
- `p_checked` : Boolean (cocher ou décocher)

**Logique Interne**
```sql
-- Cas 1 : p_step = 'published' (switch Publié/Non Publié)
-- → Force toutes les dates à today ou NULL

-- Cas 2 : p_step = étape normale + p_checked = true
-- → Utilise COALESCE(date_existante, today) pour préserver

-- Cas 3 : p_step = étape normale + p_checked = false
-- → Met date à NULL + cascade forward
```

**Optimisations**
- Optimistic UI côté client
- Batch update via RPC (1 seul appel réseau)
- Refresh automatique après 300ms

## Statut Final "Publié/Non Publié"

Le statut final dépend de :
1. **Production** (prioritaire) : Toutes les étapes pertinentes complétées ?
2. **Date+Heure** : `publication_date + publication_time ≤ now()` ?

**Règle**
- Production incomplète → **Non publié** (même si date passée)
- Production complète + date future → **Non publié**
- Production complète + date passée → **Publié**

Voir `INSTAGRAM_FEED_PUBLICATION_RULES.md` pour plus de détails.
