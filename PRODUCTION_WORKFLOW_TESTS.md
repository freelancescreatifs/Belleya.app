# Tests du workflow de production : Étapes + Tâches + Agenda + Statut

## Vue d'ensemble

Ce document décrit tous les tests à effectuer pour valider le workflow complet de production de contenu.

## Règles métier implémentées

### 1. Cascade en cochage (Forward Fill)
Cocher "Planifié" (dernière étape) coche automatiquement toutes les étapes précédentes pertinentes.

### 2. Cascade en décochage (Rollback)
Décocher une étape intermédiaire décoche automatiquement toutes les étapes suivantes.

### 3. Création automatique des tâches
- Dès qu'une étape a une date, une tâche est créée automatiquement
- La tâche est liée au contenu et à l'étape de production
- La tâche apparaît dans l'agenda avec `show_in_calendar = true`

### 4. Statut du post
- Si "Planifié" (date_scheduling) coché ET date/heure passée → "published"
- Si "Planifié" coché ET date/heure future → "scheduled"
- Si "Planifié" NON coché → statut basé sur les autres étapes (script, shooting, editing)

---

## Tests à effectuer

### Test 1 : Cascade forward (Cocher "Planifié" coche tout)

**Étapes :**
1. Créer un nouveau post avec une date de publication
2. Ne cocher AUCUNE étape au départ
3. Cliquer sur la checkbox "Planifié" (dernière étape)

**Résultat attendu :**
- ✅ Toutes les étapes pertinentes se cochent automatiquement (Script, Shooting, Montage, Planifié)
- ✅ Des tâches sont créées pour chaque étape cochée
- ✅ Les tâches apparaissent dans l'agenda
- ✅ Toutes les tâches sont marquées `completed = true`
- ✅ Le statut du post passe à "published" (si date passée) ou "scheduled" (si date future)

**Validation dans la BDD :**
```sql
-- Vérifier que toutes les dates sont créées
SELECT date_script, date_shooting, date_editing, date_scheduling, status
FROM content_calendar
WHERE id = '[ID_DU_POST]';

-- Vérifier que toutes les tâches existent et sont terminées
SELECT pt.production_step, t.completed, t.show_in_calendar
FROM production_tasks pt
JOIN tasks t ON t.id = pt.task_id
WHERE pt.content_id = '[ID_DU_POST]';
```

---

### Test 2 : Cascade backward (Décocher "Script" décoche tout)

**Étapes :**
1. Partir d'un post où toutes les étapes sont cochées
2. Cliquer sur la checkbox "Script" (première étape) pour la décocher

**Résultat attendu :**
- ✅ Toutes les étapes se décochent (Script, Shooting, Montage, Planifié)
- ✅ Toutes les tâches passent à `completed = false`
- ✅ Toutes les dates sont supprimées (date_script, date_shooting, date_editing, date_scheduling)
- ✅ Le statut du post passe à "script" (statut par défaut)

**Validation dans la BDD :**
```sql
-- Vérifier que toutes les dates sont NULL
SELECT date_script, date_shooting, date_editing, date_scheduling, status
FROM content_calendar
WHERE id = '[ID_DU_POST]';

-- Vérifier que les tâches sont décochées (ou n'existent plus selon comportement)
SELECT pt.production_step, t.completed
FROM production_tasks pt
JOIN tasks t ON t.id = pt.task_id
WHERE pt.content_id = '[ID_DU_POST]';
```

---

### Test 3 : Cascade partielle (Décocher "Montage" décoche Montage + Planifié)

**Étapes :**
1. Partir d'un post où toutes les étapes sont cochées
2. Cliquer sur la checkbox "Montage" (étape intermédiaire) pour la décocher

**Résultat attendu :**
- ✅ "Script" et "Tournage" restent cochés
- ✅ "Montage" et "Planifié" se décochent
- ✅ Les tâches correspondantes passent à `completed = false`
- ✅ Les dates `date_editing` et `date_scheduling` sont supprimées
- ✅ Les dates `date_script` et `date_shooting` restent présentes
- ✅ Le statut du post passe à "shooting"

**Validation dans la BDD :**
```sql
SELECT date_script, date_shooting, date_editing, date_scheduling, status
FROM content_calendar
WHERE id = '[ID_DU_POST]';
```

---

### Test 4 : Création automatique des tâches (Dates existantes → Tâches créées)

**Étapes :**
1. Créer un post manuellement en base avec des dates de production MAIS sans tâches associées
2. Recharger la page ou recharger les tâches

**Résultat attendu :**
- ✅ Les tâches sont créées automatiquement pour chaque date existante
- ✅ Les tâches ont `completed = false` par défaut
- ✅ Les tâches apparaissent dans l'agenda
- ✅ Les checkboxes sont décochées (car completed = false)

**Création manuelle en BDD :**
```sql
-- Créer un post avec des dates mais sans tâches
INSERT INTO content_calendar (user_id, company_id, title, content_type, publication_date, date_script, date_shooting)
VALUES ('[USER_ID]', '[COMPANY_ID]', 'Test Auto Tasks', 'reel', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE);

-- Vérifier qu'il n'y a pas de tâches
SELECT * FROM production_tasks WHERE content_id = '[ID_DU_POST]';

-- Déclencher le trigger en modifiant le post
UPDATE content_calendar SET updated_at = now() WHERE id = '[ID_DU_POST]';

-- Vérifier que les tâches sont créées
SELECT pt.production_step, t.completed
FROM production_tasks pt
JOIN tasks t ON t.id = pt.task_id
WHERE pt.content_id = '[ID_DU_POST]';
```

---

### Test 5 : Statut "Publié" uniquement si "Planifié" coché ET date passée

**Étapes :**
1. Créer un post avec une date de publication dans le passé (ex: hier)
2. Ne PAS cocher "Planifié"

**Résultat attendu :**
- ✅ Le statut du post est "script", "shooting", ou "editing" (selon les étapes cochées)
- ✅ Le statut n'est PAS "published" même si la date est passée

**Étapes supplémentaires :**
3. Cocher "Planifié"

**Résultat attendu :**
- ✅ Le statut du post passe automatiquement à "published"

**Validation dans la BDD :**
```sql
SELECT date_scheduling, publication_date, publication_time, status
FROM content_calendar
WHERE id = '[ID_DU_POST]';
```

---

### Test 6 : Statut "Planifié" si date future

**Étapes :**
1. Créer un post avec une date de publication dans le futur (ex: demain)
2. Cocher "Planifié"

**Résultat attendu :**
- ✅ Le statut du post est "scheduled" (et non "published")

**Attendre que la date passe :**
3. Modifier la date de publication pour qu'elle soit dans le passé
4. Déclencher un update du post

**Résultat attendu :**
- ✅ Le statut du post passe automatiquement à "published"

---

### Test 7 : Synchronisation Agenda (Tâches visibles dans l'agenda)

**Étapes :**
1. Créer un post et cocher plusieurs étapes
2. Ouvrir l'agenda

**Résultat attendu :**
- ✅ Toutes les tâches de production apparaissent dans l'agenda aux dates correspondantes
- ✅ Les tâches terminées sont visibles mais avec un style différent
- ✅ Les tâches non terminées apparaissent comme "À faire"

---

### Test 8 : Aucun doublon de tâche

**Étapes :**
1. Cocher une étape plusieurs fois de suite (cocher, décocher, recocher)
2. Vérifier dans la BDD

**Résultat attendu :**
- ✅ Une seule tâche existe par étape
- ✅ Pas de tâches dupliquées

**Validation dans la BDD :**
```sql
SELECT production_step, COUNT(*)
FROM production_tasks
WHERE content_id = '[ID_DU_POST]'
GROUP BY production_step;
```

---

### Test 9 : Checkboxes toujours cliquables (Pas de blocage UI)

**Étapes :**
1. Cliquer rapidement sur plusieurs checkboxes
2. Observer l'état pendant le chargement

**Résultat attendu :**
- ✅ Les checkboxes ont un état disabled temporaire pendant le chargement
- ✅ L'opacité diminue pendant le chargement (feedback visuel)
- ✅ Après le chargement, les checkboxes redeviennent cliquables
- ✅ L'état final reflète correctement les modifications

---

### Test 10 : Changement de date de publication (Tâches déplacées)

**Étapes :**
1. Créer un post avec des étapes cochées (tâches créées)
2. Modifier la date de publication du post

**Résultat attendu :**
- ✅ Les tâches restent associées au contenu
- ✅ Les tâches apparaissent à la nouvelle date dans l'agenda (selon leur date respective)

---

## Résumé des tests

| # | Test | Statut |
|---|------|--------|
| 1 | Cascade forward : Cocher "Planifié" coche tout | ⏳ |
| 2 | Cascade backward : Décocher "Script" décoche tout | ⏳ |
| 3 | Cascade partielle : Décocher étape intermédiaire | ⏳ |
| 4 | Création automatique des tâches | ⏳ |
| 5 | Statut "Publié" uniquement si "Planifié" coché + date passée | ⏳ |
| 6 | Statut "Planifié" si date future | ⏳ |
| 7 | Synchronisation avec l'agenda | ⏳ |
| 8 | Aucun doublon de tâche | ⏳ |
| 9 | Checkboxes toujours cliquables | ⏳ |
| 10 | Changement de date de publication | ⏳ |

---

## Notes techniques

### Fonctions RPC

- `cascade_production_steps(p_content_id, p_step, p_checked)` : Gère le cochage/décochage en cascade
- `calculate_post_status(...)` : Calcule le statut du post

### Triggers

- `trigger_sync_production_tasks` : Crée/met à jour les tâches quand les dates changent
- `trigger_auto_update_post_status` : Met à jour le statut automatiquement
- `trigger_update_content_dates_from_task` : Synchronisation inverse (tâche → contenu)

### Tables

- `content_calendar` : Contenu avec dates de production (date_script, date_shooting, etc.)
- `tasks` : Tâches avec statut completed
- `production_tasks` : Table de liaison entre content_calendar et tasks
