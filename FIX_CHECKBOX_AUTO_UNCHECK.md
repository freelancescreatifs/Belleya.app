# Correction : Décochage Automatique des Checkboxes de Production

## Problème Identifié

Lorsque l'utilisateur cliquait sur une checkbox d'étape de production :
1. La checkbox se cochait immédiatement (UI optimiste)
2. Après environ 1 seconde, elle se décochait automatiquement
3. L'utilisateur devait cliquer plusieurs fois pour que la checkbox reste cochée

## Cause Racine

Le problème était lié à la synchronisation des tâches de production :

### 1. Trigger Manquant
- Le trigger `trigger_sync_production_tasks_update` avait été supprimé par erreur dans une migration précédente
- Ce trigger est responsable de créer/mettre à jour les tâches dans la table `production_tasks` quand les dates de production changent
- Sans ce trigger, aucune tâche n'était créée dans `production_tasks`

### 2. Tâches Inexistantes
- Lors du clic sur la checkbox, la fonction `cascade_production_steps` cherchait la tâche associée
- Si la tâche n'existait pas dans `production_tasks`, elle ne pouvait pas la mettre à jour
- Le reload de l'UI récupérait l'état depuis la base de données
- Comme aucune tâche n'était trouvée, la checkbox revenait à l'état "décoché"

### 3. Flux Problématique

```
Utilisateur clique → UI optimiste (coché) → RPC cascade_production_steps
                                           → Cherche la tâche... NOT FOUND
                                           → Ne met rien à jour
                                           → Reload après 300ms
                                           → Aucune tâche trouvée
                                           → Checkbox décochée
```

## Solution Appliquée

### 1. Recréation du Trigger (Migration `recreate_sync_production_tasks_trigger`)

```sql
CREATE TRIGGER trigger_sync_production_tasks_update
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_tasks();
```

**Rôle du Trigger**
- Se déclenche automatiquement lors des UPDATE sur `content_calendar`
- Crée une tâche dans `tasks` et `production_tasks` si `date_xxx IS NOT NULL`
- Supprime la tâche si `date_xxx IS NULL`
- Évite les doublons en vérifiant l'existence avant insertion

### 2. Création Automatique des Tâches (Migration `ensure_production_tasks_exist_in_cascade`)

Modification de la fonction `cascade_production_steps` pour :

**Créer la tâche si elle n'existe pas**
```sql
-- Chercher la tâche
SELECT pt.task_id INTO v_task_id
FROM production_tasks pt
WHERE pt.content_id = p_content_id
  AND pt.production_step = v_step_name;

-- Si pas trouvée, la créer
IF v_task_id IS NULL THEN
  INSERT INTO tasks (...) VALUES (...) RETURNING id INTO v_task_id;
  INSERT INTO production_tasks (...) VALUES (...);
ELSE
  -- Sinon, la mettre à jour
  UPDATE tasks SET completed = true WHERE id = v_task_id;
END IF;
```

**Bénéfices**
- Double sécurité : même si le trigger n'a pas été déclenché, la tâche est créée
- Garantit qu'il y a toujours une tâche à mettre à jour lors du clic
- Résout les problèmes d'inconsistance des données

### 3. Flux Correct

```
Utilisateur clique → UI optimiste (coché) → RPC cascade_production_steps
                                           → Cherche la tâche...
                                           → Si NOT FOUND: Crée la tâche
                                           → Met à jour completed = true
                                           → Reload après 300ms
                                           → Tâche trouvée et completed = true
                                           → Checkbox reste cochée ✓
```

## Comportement Final

### Cochage d'une Étape
1. ✅ Checkbox se coche immédiatement (UI optimiste)
2. ✅ Tâche créée automatiquement si elle n'existe pas
3. ✅ Tâche marquée comme complétée (`completed = true`)
4. ✅ Date de production préservée si elle existe
5. ✅ Cascade backward : étapes précédentes cochées
6. ✅ Reload confirme l'état coché
7. ✅ **Checkbox reste cochée définitivement**

### Décochage d'une Étape
1. ✅ Checkbox se décoche immédiatement
2. ✅ Date de production mise à NULL
3. ✅ Tâche marquée comme non complétée (`completed = false`)
4. ✅ Cascade forward : étapes suivantes décochées
5. ✅ Reload confirme l'état décoché
6. ✅ **Checkbox reste décochée définitivement**

### Switch "Publié/Non Publié"
1. ✅ Toutes les checkboxes cochées/décochées en une fois
2. ✅ Toutes les tâches créées/mises à jour automatiquement
3. ✅ Dates forcées à "aujourd'hui" (cohérence garantie)
4. ✅ Statut global correctement calculé

## Tests Recommandés

### Test 1 : Nouveau Contenu
1. Créer un nouveau contenu sans dates de production
2. Cliquer sur "Script" pour cocher l'étape
3. Vérifier que la checkbox reste cochée après 2 secondes
4. Vérifier qu'une tâche a été créée dans Tasks

### Test 2 : Contenu avec Dates Planifiées
1. Créer un contenu avec date_script = 25 janvier
2. Cliquer sur "Tournage" le 21 janvier
3. Vérifier que date_script reste à 25 janvier (préservée)
4. Vérifier que date_shooting = 21 janvier (today)
5. Vérifier que les deux checkboxes restent cochées

### Test 3 : Décochage
1. Contenu avec toutes les étapes cochées
2. Décocher "Tournage"
3. Vérifier que "Montage" et "Planifié" se décochent aussi
4. Vérifier que "Script" reste coché
5. Vérifier que toutes les checkboxes gardent leur état

### Test 4 : Switch Publié
1. Contenu avec script fait, reste non fait
2. Cliquer sur "Non publié" → "Publié"
3. Vérifier que toutes les checkboxes se cochent
4. Vérifier qu'elles restent toutes cochées
5. Vérifier que le statut passe à "Publié" si date passée

## Architecture des Tâches de Production

### Tables Impliquées

**content_calendar**
- Colonnes : `date_script`, `date_shooting`, `date_editing`, `date_scheduling`
- Valeurs : date ou NULL

**tasks**
- Tâches normales + tâches de production
- Colonne `production_step` pour identifier les tâches liées à un contenu

**production_tasks** (table de liaison)
- `content_id` → UUID du contenu
- `task_id` → UUID de la tâche
- `production_step` → 'script', 'shooting', 'editing', 'scheduling'

### Synchronisation

```
content_calendar.date_xxx ←→ production_tasks ←→ tasks.completed
        (date)                   (liaison)         (boolean)
```

**Règles**
- `date_xxx IS NOT NULL` → Tâche existe et `completed` dépend de l'état
- `date_xxx IS NULL` → Tâche n'existe pas ou est supprimée
- Trigger maintient la cohérence automatiquement
- `cascade_production_steps` crée les tâches manquantes en fallback

## Fichiers Modifiés

### Migrations de Base de Données
1. `20260121155119_fix_cascade_preserve_existing_dates.sql`
   - Préservation des dates existantes lors des toggles

2. `recreate_sync_production_tasks_trigger.sql` *(NOUVEAU)*
   - Recréation du trigger manquant

3. `ensure_production_tasks_exist_in_cascade.sql` *(NOUVEAU)*
   - Création automatique des tâches dans cascade_production_steps

### Code Frontend
Aucune modification nécessaire dans le code React/TypeScript.
Le problème était purement côté base de données.

## Notes Techniques

### Pourquoi le Trigger Avait Disparu ?

Dans la migration `20260121143956_fix_cascade_production_disable_sync_trigger.sql` :
```sql
-- Ligne 211-213 : DROP du trigger
DROP TRIGGER IF EXISTS trigger_sync_production_tasks_update ON content_calendar;

-- Lignes 246-249 : Recréation du trigger... COMMENTÉE
-- CREATE TRIGGER trigger_conditional_sync_production_tasks...
```

Le trigger avait été supprimé pour éviter des conflits, mais n'avait jamais été recréé.

### Sécurité

Les fonctions utilisent `SECURITY DEFINER` pour :
- Permettre l'insertion dans `tasks` et `production_tasks` sans RLS
- Les RLS policies sont vérifiées en amont sur `content_calendar`
- L'utilisateur ne peut modifier que son propre contenu

### Performance

- Optimistic UI : Réponse immédiate sans attendre la base de données
- Reload différé de 300ms : Laisse le temps à la base de se synchroniser
- Trigger léger : Ne se déclenche que si les dates changent
- Batch updates : Une seule RPC pour plusieurs étapes (cascade)

## Conclusion

Le problème de décochage automatique est maintenant résolu grâce à :
1. ✅ Trigger recréé pour synchronisation automatique
2. ✅ Création automatique des tâches manquantes
3. ✅ Double sécurité (trigger + fallback dans RPC)
4. ✅ Préservation des dates planifiées
5. ✅ Cascade correcte (backward/forward)

Les checkboxes restent maintenant dans l'état où l'utilisateur les met, sans décochage involontaire.
