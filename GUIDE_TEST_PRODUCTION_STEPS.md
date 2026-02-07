# Guide de test - Étapes de production

## Test rapide de la correction

### 1. Créer un nouveau contenu avec dates de production

1. Aller dans **Studio de contenu**
2. Cliquer sur **"+ Nouveau contenu"**
3. Remplir le formulaire :
   ```
   Titre: "Mon premier reel"
   Type: Reel
   Plateforme: Instagram
   Date de publication: [demain]
   ```
4. Cocher **"Afficher les dates de production"**
5. Remplir les dates :
   ```
   Script: [dans 2 jours] à 10:00
   Tournage: [dans 3 jours] à 14:00
   Montage: [dans 4 jours] à 09:00
   Programmation: [dans 5 jours] à 11:00
   ```
6. Cliquer **"Enregistrer"**

**Résultat attendu** :
- ✅ Aucune erreur affichée
- ✅ Message de succès "Contenu créé"
- ✅ Retour à la liste des contenus

### 2. Vérifier la création des tâches

1. Aller dans **Tâches**
2. Chercher dans la liste :
   ```
   - "Écriture - Mon premier reel"
   - "Tournage - Mon premier reel"
   - "Montage - Mon premier reel"
   - "Programmation - Mon premier reel"
   ```

**Résultat attendu** :
- ✅ Les 4 tâches sont visibles
- ✅ Chaque tâche a la bonne date
- ✅ Durée = 1 heure pour chaque

### 3. Vérifier dans l'Agenda vue Jour

1. Aller dans **Agenda**
2. Sélectionner **vue "Jour"**
3. Naviguer vers la date du script (dans 2 jours)

**Résultat attendu** :
- ✅ La tâche "Écriture - Mon premier reel" apparaît
- ✅ Elle dure 1 heure (10:00 - 11:00)
- ✅ Badge "Réseaux sociaux" visible

### 4. Vérifier dans le Calendrier de production

1. Aller dans **Studio de contenu**
2. Cliquer sur l'onglet **"Calendrier de production"**
3. Sélectionner **vue "Semaine"**

**Résultat attendu** :
- ✅ Les 4 étapes sont visibles aux bonnes dates
- ✅ Couleurs différentes par étape :
  - Script = bleu
  - Tournage = rouge
  - Montage = violet
  - Programmation = orange

### 5. Test de modification de date

1. Retourner dans **Studio de contenu**
2. Trouver "Mon premier reel" et cliquer dessus
3. Modifier la date de script : [demain] au lieu de [dans 2 jours]
4. Cliquer **"Enregistrer"**

**Résultat attendu** :
- ✅ Sauvegarde réussie
- ✅ Aller dans Agenda vue Jour demain
- ✅ La tâche "Écriture" a bien changé de date

### 6. Test de synchronisation inverse (cocher une tâche)

1. Aller dans **Agenda vue Jour**
2. Trouver une tâche de production non cochée
3. Cocher la tâche

**Résultat attendu** :
- ✅ La tâche se coche
- ✅ Retourner dans Studio de contenu
- ✅ La date de production correspondante est ajoutée
- ✅ Le statut du contenu se met à jour

### 7. Test de synchronisation inverse (décocher une tâche)

1. Décocher la même tâche dans l'Agenda

**Résultat attendu** :
- ✅ La tâche se décoche
- ✅ Dans Studio de contenu
- ✅ La date de production est supprimée
- ✅ Le statut revient en arrière

### 8. Test de suppression de date de production

1. Éditer le contenu dans Studio
2. Vider la date de "Montage"
3. Sauvegarder

**Résultat attendu** :
- ✅ Sauvegarde réussie
- ✅ Dans Tâches, "Montage - Mon premier reel" a disparu
- ✅ Dans Agenda, plus de tâche de montage pour ce contenu

## Erreurs à surveiller

### Si erreur "FK violation"
```
❌ Erreur : insert/update sur production_tasks viole la FK
```
**Cause** : Le trigger BEFORE essaie encore de créer les tâches
**Solution** : Vérifier que la migration `fix_production_tasks_fk_timing.sql` est bien appliquée

### Si erreur "due_date does not exist"
```
❌ Erreur : column "due_date" of relation "tasks" does not exist
```
**Cause** : Ancienne fonction sync_production_tasks utilisée
**Solution** : Vérifier les triggers sur content_calendar

### Si les tâches ne se créent pas
```
✅ Contenu créé MAIS ❌ Aucune tâche dans la liste Tâches
```
**Cause** : Trigger AFTER non exécuté ou erreur silencieuse
**Solution** : Vérifier les logs de la base de données

## Vérifications en base de données (optionnel)

Si vous avez accès à la console SQL Supabase :

### Vérifier les triggers
```sql
SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'content_calendar'
ORDER BY action_timing, trigger_name;
```

**Résultat attendu** :
```
BEFORE:
- trigger_calculate_content_status (INSERT, UPDATE)

AFTER:
- trigger_sync_production_tasks_after (INSERT, UPDATE)
```

### Vérifier qu'un contenu a bien créé ses tâches
```sql
-- Remplacer 'Mon premier reel' par votre titre
SELECT
  cc.title as contenu,
  t.title as tache,
  t.production_step as etape,
  t.start_date as date,
  t.duration_minutes as duree
FROM content_calendar cc
JOIN production_tasks pt ON pt.content_id = cc.id
JOIN tasks t ON t.id = pt.task_id
WHERE cc.title LIKE '%Mon premier reel%'
ORDER BY t.start_date;
```

**Résultat attendu** :
```
| contenu          | tache                              | etape      | date       | duree |
|------------------|------------------------------------|------------|------------|-------|
| Mon premier reel | Écriture - Mon premier reel        | script     | 2024-02-05 | 60    |
| Mon premier reel | Tournage - Mon premier reel        | shooting   | 2024-02-06 | 60    |
| Mon premier reel | Montage - Mon premier reel         | editing    | 2024-02-07 | 60    |
| Mon premier reel | Programmation - Mon premier reel   | scheduling | 2024-02-08 | 60    |
```

## Checklist complète

- [ ] Création de contenu avec dates de production → Aucune erreur
- [ ] Les 4 tâches sont créées dans la section Tâches
- [ ] Les tâches apparaissent dans Agenda vue Jour
- [ ] Les étapes apparaissent dans Calendrier de production
- [ ] Modification de date de production → tâche mise à jour
- [ ] Cocher une tâche → date de production ajoutée
- [ ] Décocher une tâche → date de production supprimée
- [ ] Supprimer une date de production → tâche supprimée
- [ ] Toutes les durées = 1 heure
- [ ] Statuts synchronisés partout

Si tous les points sont cochés : ✅ **Le système fonctionne parfaitement !**
