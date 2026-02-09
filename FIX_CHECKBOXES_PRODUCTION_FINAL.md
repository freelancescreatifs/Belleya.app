# Correction finale : Checkboxes de production non cliquables

## Problème identifié

Les checkboxes des étapes de production ne répondaient pas aux clics. La cause était une **inversion de la source de vérité**.

### Erreur de conception initiale

La fonction `getProductionStepsWithRealStatus` utilisait le statut `completed` des **tâches** pour déterminer si une checkbox devait être cochée :

```typescript
// ❌ AVANT - INCORRECT
function getProductionStepsWithRealStatus(content: ContentItem) {
  const allSteps = getProductionSteps(content);
  const contentTasks = productionTasksMap.get(content.id);

  if (!contentTasks) return allSteps;

  return allSteps.map(step => ({
    ...step,
    isCompleted: contentTasks.get(step.key) || false  // ❌ Basé sur les tâches
  }));
}
```

### Problème conceptuel

**Logique incorrecte** :
```
Tâches (completed) → Déterminent l'état des checkboxes
```

**Logique correcte** :
```
Dates (date_script, date_shooting, etc.) → Déterminent l'état des checkboxes
Tâches → Suivent les checkboxes (conséquence, pas source)
```

## Règles métier correctes

1. **Une checkbox est cochée** si sa date correspondante existe dans `content_calendar`
   - Exemple : `date_script` existe → Checkbox "Script" cochée
   - Exemple : `date_script` est NULL → Checkbox "Script" décochée

2. **Les tâches suivent les checkboxes**, pas l'inverse
   - Checkbox cochée → Tâche créée avec `completed = true`
   - Checkbox décochée → Date supprimée + Tâche `completed = false`

## Corrections apportées

### 1. Correction de `getProductionStepsWithRealStatus`

```typescript
// ✅ APRÈS - CORRECT
function getProductionStepsWithRealStatus(content: ContentItem) {
  const allSteps = getProductionSteps(content);

  // Une étape est complétée si sa date existe dans content_calendar
  return allSteps.map(step => {
    let isCompleted = false;

    switch (step.key) {
      case 'date_script':
        isCompleted = !!content.date_script;
        break;
      case 'date_shooting':
        isCompleted = !!content.date_shooting;
        break;
      case 'date_editing':
        isCompleted = !!content.date_editing;
        break;
      case 'date_scheduling':
        isCompleted = !!content.date_scheduling;
        break;
    }

    return {
      ...step,
      isCompleted  // ✅ Basé sur les dates du contenu
    };
  });
}
```

### 2. Simplification de `toggleProductionStep`

Suppression du code inutile qui rechargeait les tâches pour mettre à jour les checkboxes :

```typescript
// ✅ APRÈS - Simplifié
async function toggleProductionStep(contentId: string, stepKey: string, currentCompleted: boolean) {
  if (!user) return;

  const loadingKey = `${contentId}-${stepKey}`;
  if (loadingSteps.has(loadingKey)) return;

  const stepMapping: Record<string, string> = {
    'date_script': 'script',
    'date_shooting': 'shooting',
    'date_editing': 'editing',
    'date_scheduling': 'scheduling'
  };

  const productionStepName = stepMapping[stepKey];
  if (!productionStepName) return;

  const newCompleted = !currentCompleted;
  setLoadingSteps(prev => new Set(prev).add(loadingKey));

  try {
    const { data, error } = await supabase
      .rpc('cascade_production_steps', {
        p_content_id: contentId,
        p_step: productionStepName,
        p_checked: newCompleted
      });

    if (error) throw error;

    // Recharger les contenus pour avoir les nouvelles dates
    onContentUpdated();
  } catch (error) {
    console.error('Error toggling production step:', error);
    onContentUpdated();
  } finally {
    setLoadingSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(loadingKey);
      return newSet;
    });
  }
}
```

### 3. Suppression du code obsolète

- Suppression de `productionTasksMap` (state inutile)
- Suppression de `loadProductionTasks()` (fonction inutile)
- Simplification de `handleTogglePublished()`

## Flux de données correct

### Avant (incorrect)

```
┌─────────────────────────────────────────────────────────┐
│  1. User clique sur checkbox                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. RPC cascade_production_steps                        │
│     - Crée/supprime les dates                           │
│     - Crée/met à jour les tâches                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. Recharge les TÂCHES depuis Supabase                 │
│     - Query production_tasks + tasks.completed          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. Met à jour productionTasksMap                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. getProductionStepsWithRealStatus                    │
│     - Lit productionTasksMap                            │
│     - isCompleted = tasks.completed ❌                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  6. Checkbox mise à jour... ou pas ❌                   │
└─────────────────────────────────────────────────────────┘
```

### Après (correct)

```
┌─────────────────────────────────────────────────────────┐
│  1. User clique sur checkbox                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. RPC cascade_production_steps                        │
│     - Crée/supprime les DATES dans content_calendar     │
│     - Crée/met à jour les tâches (conséquence)          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. onContentUpdated() - Recharge les CONTENUS          │
│     - Récupère les nouvelles dates (date_script, etc.)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. getProductionStepsWithRealStatus                    │
│     - Lit content.date_script, content.date_shooting    │
│     - isCompleted = !!date ✅                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. Checkbox mise à jour correctement ✅                │
└─────────────────────────────────────────────────────────┘
```

## Résumé des changements

### Fichier : `src/components/content/EditorialCalendar.tsx`

| Avant | Après |
|-------|-------|
| State `productionTasksMap` | Supprimé |
| Fonction `loadProductionTasks()` | Supprimée |
| `getProductionStepsWithRealStatus` utilise les tâches | `getProductionStepsWithRealStatus` utilise les dates |
| `toggleProductionStep` recharge les tâches | `toggleProductionStep` recharge les contenus |
| `handleTogglePublished` gère productionTasksMap | `handleTogglePublished` simplifié |

### Performance

**Avant** :
- Query vers `production_tasks` + join `tasks` à chaque action
- Construction d'une Map complexe

**Après** :
- Lecture directe des dates depuis l'objet `content` (déjà en mémoire)
- Aucune query supplémentaire

## Tests de validation

### Test 1 : Cocher une étape

1. Cliquer sur "Script"
2. Vérifier que `content.date_script` existe
3. Vérifier que la checkbox est cochée

### Test 2 : Cascade forward

1. Cliquer sur "Planifié"
2. Vérifier que toutes les checkboxes se cochent
3. Vérifier que toutes les dates existent

### Test 3 : Cascade backward

1. Partir d'un post complet
2. Décocher "Montage"
3. Vérifier que "Montage" et "Planifié" se décochent
4. Vérifier que `date_editing` et `date_scheduling` sont NULL

### Test 4 : Pas de régression

1. Les tâches sont toujours créées automatiquement
2. Les tâches apparaissent dans l'agenda
3. Le statut du post est correctement calculé

## Conclusion

Le problème était une inversion de la source de vérité. Les checkboxes doivent refléter les **dates** dans `content_calendar`, pas le statut `completed` des tâches. Cette correction restaure le comportement attendu tout en simplifiant considérablement le code.

**Statut** : ✅ Corrigé et testé
**Build** : ✅ Passe sans erreur
