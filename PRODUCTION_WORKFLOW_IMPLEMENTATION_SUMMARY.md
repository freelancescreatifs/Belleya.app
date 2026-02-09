# Résumé de l'implémentation du workflow de production

## Vue d'ensemble

Ce document résume toutes les modifications apportées pour corriger et implémenter le workflow complet de production de contenu avec cascade, création automatique de tâches, et gestion intelligente du statut des posts.

---

## Problèmes corrigés

### 1. Checkboxes bloquées / non interactives
**Problème :** Les checkboxes de production n'étaient pas cliquables ou semblaient figées.

**Solution :**
- Ajout d'un state `loadingSteps` pour gérer les états de chargement
- Les checkboxes sont désactivées pendant l'appel RPC avec feedback visuel (opacité réduite)
- Protection contre les double-clics
- Synchronisation correcte après chaque action

### 2. Tâches non créées
**Problème :** Les tâches n'étaient pas créées automatiquement pour les étapes.

**Solution :**
- Le trigger `sync_production_tasks` crée automatiquement les tâches quand des dates existent
- La fonction `cascade_production_steps` crée les tâches manquantes lors du cochage
- Une tâche est créée avec `completed = false` par défaut pour les dates existantes non cochées

### 3. Logique cascade absente
**Problème :** Cocher/décocher une étape n'avait pas d'effet en cascade.

**Solution :**
- **Cascade forward** : Cocher "Planifié" coche automatiquement toutes les étapes précédentes
- **Cascade backward** : Décocher une étape décoche automatiquement toutes les étapes suivantes
- Respect des étapes pertinentes selon le type de contenu (post, reel, carrousel, etc.)

### 4. Statut du post incohérent
**Problème :** Le statut passait à "Publié" même sans avoir coché "Planifié".

**Solution :**
- Nouvelle fonction `calculate_post_status` qui calcule le statut selon les règles métier strictes
- Statut "published" UNIQUEMENT si "Planifié" coché ET date/heure passée
- Statut "scheduled" si "Planifié" coché ET date/heure future
- Trigger automatique qui recalcule le statut à chaque changement de date

---

## Modifications backend (Supabase)

### Fichier : `supabase/migrations/fix_production_cascade_and_post_status_v2.sql`

#### 1. Fonction `calculate_post_status(...)`

**Signature :**
```sql
calculate_post_status(
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date,
  p_publication_date date,
  p_publication_time text
) RETURNS text
```

**Logique :**
- Si `date_scheduling` existe (Planifié coché) :
  - Construire le datetime de publication
  - Comparer avec l'heure actuelle
  - Retourner "published" ou "scheduled"
- Si `date_scheduling` n'existe pas :
  - Retourner le statut selon les autres étapes complétées (editing → shooting → script)

#### 2. Fonction `cascade_production_steps(...)` réécrite

**Logique de cochage (CASCADE BACKWARD) :**
```
Cocher étape N → Cocher automatiquement toutes les étapes de 1 à N
```

Pour chaque étape à cocher :
1. Vérifier si une date existe déjà
2. Si non, créer la date (CURRENT_DATE)
3. Trouver la tâche associée
4. Si la tâche n'existe pas, la créer avec `completed = true`
5. Si la tâche existe, la marquer `completed = true`

**Logique de décochage (CASCADE FORWARD) :**
```
Décocher étape N → Décocher automatiquement toutes les étapes de N à fin
```

Pour chaque étape à décocher :
1. Trouver la tâche associée
2. Marquer la tâche `completed = false`
3. Supprimer la date de l'étape dans `content_calendar`

**Recalcul du statut :**
- Après chaque cascade, recalculer automatiquement le statut du post
- Mettre à jour `content_calendar.status`

#### 3. Trigger `auto_update_post_status`

**Déclenchement :** Sur `UPDATE` de `date_script`, `date_shooting`, `date_editing`, `date_scheduling`, `publication_date`, `publication_time`

**Action :**
- Recalculer le statut avec `calculate_post_status(...)`
- Mettre à jour `NEW.status`

**Protection :** Évite les boucles avec le flag `app.in_production_cascade`

---

## Modifications frontend (React)

### Fichier : `src/components/content/EditorialCalendar.tsx`

#### 1. Ajout du state `loadingSteps`

```typescript
const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set());
```

**Utilité :** Tracker les checkboxes en cours de traitement pour les désactiver temporairement.

#### 2. Modification de `toggleProductionStep(...)`

**Ajouts :**
- Protection contre les double-clics avec `loadingSteps.has(loadingKey)`
- Ajout au loading state avant l'appel RPC
- Retrait du loading state dans le `finally`
- Recharge du statut `completed` réel depuis `production_tasks` après l'appel

**Code :**
```typescript
const loadingKey = `${contentId}-${stepKey}`;
if (loadingSteps.has(loadingKey)) return;

setLoadingSteps(prev => new Set(prev).add(loadingKey));

try {
  // Appel RPC
  // Recharger les tâches
} finally {
  setLoadingSteps(prev => {
    const newSet = new Set(prev);
    newSet.delete(loadingKey);
    return newSet;
  });
}
```

#### 3. Modification du rendu des checkboxes

**Ajouts :**
- Calcul de `isStepLoading` pour chaque checkbox
- Prop `disabled={isStepLoading}` sur l'input
- Classes CSS pour le feedback visuel (opacité réduite pendant le chargement)

**Code :**
```typescript
const isStepLoading = loadingSteps.has(`${content.id}-${step.key}`);

<input
  type="checkbox"
  checked={step.isCompleted}
  disabled={isStepLoading}
  onChange={() => toggleProductionStep(content.id, step.key, step.isCompleted)}
  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
/>
```

---

## Règles métier implémentées

### 1. Cascade en cochage (Forward Fill)

```
Cocher "Planifié" → Script, Tournage, Montage, Planifié tous cochés
```

### 2. Cascade en décochage (Rollback)

```
Décocher "Script" → Script, Tournage, Montage, Planifié tous décochés
Décocher "Montage" → Montage, Planifié décochés (Script, Tournage restent)
```

### 3. Création automatique des tâches

- Dès qu'une étape a une date → tâche créée avec `completed = false`
- La tâche est liée au contenu via `production_tasks`
- La tâche apparaît dans l'agenda avec `show_in_calendar = true`

### 4. Statut du post

```
"Planifié" coché + date passée → "published"
"Planifié" coché + date future → "scheduled"
"Planifié" non coché → statut basé sur autres étapes
```

---

## Synchronisation complète

### Content → Tasks
Quand on modifie les dates dans `content_calendar` :
- Le trigger `sync_production_tasks` crée/met à jour les tâches
- Les tâches sont synchronisées avec les dates

### Tasks → Content
Quand on coche/décoche une tâche dans l'agenda :
- Le trigger `update_content_dates_from_task` met à jour la date dans `content_calendar`
- La checkbox se met à jour dans l'interface

### Agenda
- Toutes les tâches de production apparaissent dans l'agenda
- Les tâches terminées et non terminées sont visibles
- Les tâches suivent automatiquement les changements de date

---

## Tests de validation

Un document complet de tests a été créé : `PRODUCTION_WORKFLOW_TESTS.md`

**Tests couverts :**
1. ✅ Cascade forward : Cocher "Planifié" coche tout
2. ✅ Cascade backward : Décocher "Script" décoche tout
3. ✅ Cascade partielle : Décocher étape intermédiaire
4. ✅ Création automatique des tâches
5. ✅ Statut "Publié" uniquement si "Planifié" coché + date passée
6. ✅ Statut "Planifié" si date future
7. ✅ Synchronisation avec l'agenda
8. ✅ Aucun doublon de tâche
9. ✅ Checkboxes toujours cliquables
10. ✅ Changement de date de publication

---

## Diagramme de flux

```
┌─────────────────────────────────────────────────────────┐
│  Utilisateur clique sur checkbox "Planifié"            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend : toggleProductionStep()                       │
│  - Ajoute au loadingSteps                               │
│  - Désactive la checkbox                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Appel RPC : cascade_production_steps()                 │
│  - Cocher toutes les étapes précédentes                │
│  - Créer les dates manquantes                          │
│  - Créer/mettre à jour les tâches                      │
│  - Recalculer le statut du post                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Trigger : auto_update_post_status                      │
│  - Met à jour content_calendar.status                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend : Recharger le statut completed               │
│  - Query production_tasks + tasks                       │
│  - Mettre à jour productionTasksMap                     │
│  - Retirer du loadingSteps                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  UI mise à jour                                          │
│  - Checkboxes reflètent le nouvel état                 │
│  - Tâches visibles dans l'agenda                       │
│  - Statut du post mis à jour                           │
└─────────────────────────────────────────────────────────┘
```

---

## Points d'attention

### 1. Types de contenu
La logique respecte les étapes pertinentes selon le type de contenu :
- **Post** : Script, Planifié
- **Story** : Script, Planifié
- **Carrousel** : Script, Montage, Planifié
- **Reel/Video** : Script, Tournage, Montage, Planifié
- **Live** : Script, Planifié

### 2. Protection contre les boucles
Les fonctions utilisent le flag `app.in_production_cascade` pour éviter les boucles infinies entre triggers.

### 3. Idempotence
Répéter la même action (cocher/décocher) ne crée pas de doublons. Les tâches sont toujours uniques par étape.

### 4. Performance
- Les checkboxes sont désactivées pendant le traitement (évite les double-clics)
- Un seul appel RPC gère toute la cascade
- Le rechargement est optimisé (une seule query pour toutes les tâches)

---

## Prochaines étapes (optionnel)

### Améliorations possibles :
1. **Notification toast** : Afficher un message de succès après chaque action
2. **Animation** : Animer les checkboxes qui se cochent/décochent en cascade
3. **Undo/Redo** : Permettre d'annuler une action
4. **Batch actions** : Cocher/décocher plusieurs posts en même temps
5. **Historique** : Logger toutes les actions de production

---

## Conclusion

Le workflow de production est maintenant complet, cohérent et fiable. Toutes les règles métier sont implémentées et les tests de validation sont documentés. Les utilisateurs peuvent désormais gérer leurs étapes de production de manière intuitive avec une synchronisation automatique entre les checkboxes, les tâches et l'agenda.
