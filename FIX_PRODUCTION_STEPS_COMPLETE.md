# Correction complète - Étapes de production

## Problèmes résolus

### 1. Erreur "column due_date does not exist"
**Problème** : La fonction `sync_production_tasks()` utilisait les anciennes colonnes `due_date` et `due_time` qui n'existent plus dans la table `tasks`.

**Solution** :
- Fonction `sync_production_tasks()` corrigée pour utiliser :
  - `start_date` et `end_date` au lieu de `due_date`
  - `start_time` et `end_time` au lieu de `due_time`
- Ajout automatique de `duration_minutes = 60` (1 heure par défaut)
- Ajout de `show_in_calendar = true` pour afficher dans la vue Jour

### 2. Triggers en double
**Problème** : Deux triggers faisaient la même chose sur `content_calendar`, créant des conflits.

**Solution** :
- Supprimé `trigger_sync_production_tasks_update` (doublon)
- Supprimé `trigger_sync_task_to_content` (fonction inexistante)
- Gardé uniquement `trigger_sync_production_tasks` (BEFORE INSERT OR UPDATE)

### 3. Synchronisation bidirectionnelle
**Problème** : La synchronisation ne fonctionnait que dans un sens (content → tasks).

**Solution** :
- Fonction `update_content_dates_from_task()` améliorée
- Trigger `trigger_update_content_dates_from_task` sur tasks (AFTER UPDATE)
- Synchronisation complète dans les deux sens :
  - ✅ Modification de dates dans Studio → crée/met à jour les tâches
  - ✅ Cocher/décocher une tâche → met à jour les dates de production
  - ✅ Statut se met à jour automatiquement partout

### 4. Durée des tâches de production
**Problème** : Les tâches n'avaient pas de durée définie.

**Solution** :
- Toutes les tâches de production ont `duration_minutes = 60` (1 heure)
- Les heures de fin sont calculées automatiquement : `end_time = start_time + 1 heure`
- Les tâches existantes ont été mises à jour avec cette durée

## Architecture finale

### Tables
- `content_calendar` : contient les dates de production (date_script, date_shooting, etc.)
- `tasks` : contient les tâches générées automatiquement
- `production_tasks` : table de liaison entre content et tasks

### Triggers actifs

#### Sur content_calendar
1. `trigger_sync_production_tasks` (BEFORE INSERT/UPDATE)
   - Crée/met à jour/supprime les tâches quand les dates changent
   - Calcule automatiquement le statut du contenu

#### Sur tasks
1. `trigger_update_content_dates_from_task` (AFTER UPDATE)
   - Met à jour les dates de production quand on coche/décoche une tâche
   - Supprime la date quand on décoche
   - Ajoute la date quand on coche

### Flux de synchronisation

```
CONTENT → TASKS
Studio de contenu : date_script = 2024-02-05
    ↓ (trigger_sync_production_tasks)
Tâche créée : "Écriture - Mon contenu" avec start_date = 2024-02-05

TASKS → CONTENT
Agenda vue Jour : cocher "Écriture - Mon contenu"
    ↓ (trigger_update_content_dates_from_task)
content_calendar.date_script = date de la tâche
```

## Comment tester

### Test 1 : Création de dates de production
1. Aller dans Studio de contenu
2. Créer ou éditer un contenu
3. Ajouter une date de production (ex: Script = demain)
4. Sauvegarder
5. ✅ Vérifier qu'aucune erreur n'apparaît
6. ✅ Aller dans Agenda vue Jour → la tâche "Écriture - [titre]" doit apparaître
7. ✅ Aller dans Tâches → la tâche doit être visible avec durée 1h

### Test 2 : Modification de dates
1. Dans Studio, modifier la date de production
2. Sauvegarder
3. ✅ La tâche dans l'Agenda doit être mise à jour à la nouvelle date

### Test 3 : Synchronisation inverse (cocher une tâche)
1. Aller dans Agenda vue Jour
2. Cocher une étape de production non cochée
3. ✅ La date de production doit être ajoutée dans le Studio
4. ✅ Le statut doit se mettre à jour (ex: "Écriture" si on coche Script)

### Test 4 : Synchronisation inverse (décocher une tâche)
1. Décocher une étape de production déjà cochée
2. ✅ La date de production doit être supprimée dans le Studio
3. ✅ Le statut doit revenir en arrière

### Test 5 : Statuts cohérents
1. Créer un contenu et cocher toutes les étapes
2. ✅ Vérifier que le statut est "Publié" dans toutes les vues :
   - Studio de contenu
   - Vue Jour
   - Vue par type de post
   - Calendrier de production
3. Décocher une étape
4. ✅ Le statut doit revenir à l'étape précédente partout

### Test 6 : Durée des tâches
1. Créer une date de production sans heure (ex: juste la date)
2. ✅ L'heure par défaut doit être 09:00
3. ✅ L'heure de fin doit être 10:00 (1 heure après)
4. ✅ Dans l'agenda, la tâche doit durer 1 heure

## Source de vérité unique

Toutes les vues utilisent désormais la même source de données :
- **Dates de production** → `content_calendar.date_*`
- **Tâches liées** → via `production_tasks`
- **Statuts** → calculés automatiquement par `determine_content_status()`

Il n'y a plus de données dupliquées ou désynchronisées.

## Migration appliquée

Fichier : `fix_production_tasks_sync_complete.sql`

Cette migration :
- ✅ Corrige la fonction `sync_production_tasks()`
- ✅ Corrige la fonction `update_content_dates_from_task()`
- ✅ Recrée les triggers correctement
- ✅ Met à jour les tâches existantes avec `duration_minutes = 60`
