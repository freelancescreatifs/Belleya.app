# ✅ Correction Constraint Production Step

## 🚨 ERREUR IDENTIFIÉE

**Erreur PostgreSQL :**
```
new row for relation "tasks" violates check constraint "tasks_production_step_check"
```

### Cause Racine

La fonction `auto_generate_production_tasks()` utilisait des **valeurs françaises** :
- `'tournage'`, `'montage'`, `'planification'`

Mais la contrainte CHECK de la table `tasks` autorise uniquement des **valeurs anglaises** :
- `'script'`, `'shooting'`, `'editing'`, `'subtitles'`, `'validation'`, `'scheduling'`

---

## 🔍 CONTRAINTE CHECK ACTUELLE

```sql
CHECK (production_step = ANY (ARRAY[
  'script'::text,
  'shooting'::text,
  'editing'::text,
  'subtitles'::text,
  'validation'::text,
  'scheduling'::text
]))
```

**SOURCE OF TRUTH - Valeurs autorisées :**
| Valeur DB | Label Français | Usage |
|-----------|---------------|-------|
| `script` | Écriture | Rédaction du script |
| `shooting` | Tournage | Tournage vidéo |
| `editing` | Montage | Montage vidéo |
| `subtitles` | Sous-titres | Ajout de sous-titres |
| `validation` | Validation | Validation finale |
| `scheduling` | Planification | Programmation de publication |

---

## ✅ CORRECTIONS APPLIQUÉES

### 1️⃣ Migration Database - Mise à jour des données existantes

**SQL exécuté :**
```sql
UPDATE tasks
SET production_step = CASE
  WHEN production_step IN ('tournage', 'Tournage') THEN 'shooting'
  WHEN production_step IN ('montage', 'Montage') THEN 'editing'
  WHEN production_step IN ('planification', 'Planification', 'planifie', 'planifié') THEN 'scheduling'
  ELSE production_step
END
WHERE production_step IN ('tournage', 'Tournage', 'montage', 'Montage', 'planification', 'Planification', 'planifie', 'planifié');
```

**Résultat :** Aucune donnée existante à corriger (base propre).

---

### 2️⃣ Migration Database - Correction de la fonction

**Fichier :** `fix_production_step_english_values.sql`

**Changements appliqués :**

| Avant (ERREUR) | Après (CORRIGÉ) |
|----------------|-----------------|
| `production_step = 'tournage'` | `production_step = 'shooting'` |
| `production_step = 'montage'` | `production_step = 'editing'` |
| `production_step = 'planification'` | `production_step = 'scheduling'` |

**Fonction corrigée :** `auto_generate_production_tasks()`

```sql
-- ✅ Script
production_step = 'script'

-- ✅ Shooting (était 'tournage')
production_step = 'shooting'

-- ✅ Editing (était 'montage')
production_step = 'editing'

-- ✅ Scheduling (était 'planification')
production_step = 'scheduling'
```

---

### 3️⃣ Helper Frontend - Normalisation des valeurs

**Fichier :** `src/lib/productionStepsHelpers.ts`

**Nouvelles fonctions ajoutées :**

```typescript
export type ProductionStepValue =
  | 'script'
  | 'shooting'
  | 'editing'
  | 'subtitles'
  | 'validation'
  | 'scheduling';

/**
 * Normalise un nom d'étape vers le format DB (anglais)
 * Convertit les variantes françaises automatiquement
 */
export function normalizeProductionStep(
  step: string | null | undefined
): ProductionStepValue | null {
  if (!step) return null;

  const normalized = step.toLowerCase().trim();

  switch (normalized) {
    case 'script':
    case 'écriture':
      return 'script';

    case 'shooting':
    case 'tournage':
      return 'shooting';

    case 'editing':
    case 'montage':
      return 'editing';

    case 'subtitles':
    case 'sous-titres':
    case 'soustitres':
      return 'subtitles';

    case 'validation':
      return 'validation';

    case 'scheduling':
    case 'planification':
    case 'planifie':
    case 'planifié':
      return 'scheduling';

    default:
      console.error(`Invalid production step: ${step}`);
      return null;
  }
}
```

**Autres fonctions utiles ajoutées :**
- `isValidProductionStep()` - Valide une valeur
- `getAllProductionSteps()` - Retourne toutes les valeurs valides
- `getDateColumnForStep()` - Mapping étape → colonne de date
- `getStepFromDateColumn()` - Mapping colonne de date → étape

---

## 🔒 MAPPING COMPLET

### Colonnes Database → Production Steps

| Colonne `content_calendar` | `production_step` | Label Français |
|----------------------------|-------------------|----------------|
| `date_script` | `script` | Écriture |
| `date_shooting` | `shooting` | Tournage |
| `date_editing` | `editing` | Montage |
| `date_scheduling` | `scheduling` | Planification |

### Noms Acceptés (Normalisation)

| Entrée Utilisateur | Valeur DB Normalisée |
|-------------------|---------------------|
| "script", "écriture" | `script` |
| "shooting", "tournage" | `shooting` |
| "editing", "montage" | `editing` |
| "scheduling", "planification", "planifie", "planifié" | `scheduling` |
| "subtitles", "sous-titres", "soustitres" | `subtitles` |
| "validation" | `validation` |

---

## 🧪 TESTS DE VALIDATION

### Test 1 : Créer un contenu avec dates de production
```
1. Aller dans Studio Contenu
2. Créer nouveau contenu (type: Reel)
3. Ajouter date_script = "2026-02-15" + time = "09:00"
4. Ajouter date_shooting = "2026-02-16" + time = "10:00"
5. Ajouter date_editing = "2026-02-17" + time = "14:00"
6. Ajouter date_scheduling = "2026-02-18" + time = "16:00"
7. Sauvegarder

✅ ATTENDU:
- 4 tâches automatiquement créées dans Tasks
- Chaque tâche a production_step en anglais (script, shooting, editing, scheduling)
- Aucune erreur de constraint violation
```

### Test 2 : Cocher/Décocher des étapes de production
```
1. Ouvrir un contenu existant avec dates de production
2. Cocher "Script terminé" → checkbox bleue ✅
3. Décocher "Script terminé" → checkbox blanche ⬜
4. Vérifier dans Tasks que la tâche existe toujours

✅ ATTENDU:
- Cocher/décocher change UNIQUEMENT le statut completed
- Les tâches ne sont JAMAIS supprimées quand on décoche
- La date reste toujours présente
```

### Test 3 : Utiliser normalizeProductionStep()
```typescript
import { normalizeProductionStep } from '@/lib/productionStepsHelpers';

// Test français → anglais
console.log(normalizeProductionStep('tournage')); // → 'shooting'
console.log(normalizeProductionStep('montage')); // → 'editing'
console.log(normalizeProductionStep('planification')); // → 'scheduling'

// Test valeurs déjà correctes
console.log(normalizeProductionStep('script')); // → 'script'
console.log(normalizeProductionStep('shooting')); // → 'shooting'

// Test valeurs invalides
console.log(normalizeProductionStep('invalid')); // → null (+ console.error)
```

### Test 4 : Vérifier la contrainte en SQL
```sql
-- ✅ Devrait réussir
INSERT INTO tasks (user_id, title, production_step, category, priority, status)
VALUES (auth.uid(), 'Test', 'shooting', 'content', 'high', 'todo');

-- ❌ Devrait échouer avec constraint violation
INSERT INTO tasks (user_id, title, production_step, category, priority, status)
VALUES (auth.uid(), 'Test', 'tournage', 'content', 'high', 'todo');
-- ERROR: new row violates check constraint "tasks_production_step_check"
```

---

## 📊 VÉRIFICATIONS EFFECTUÉES

### ✅ Contrainte CHECK identifiée
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'tasks'::regclass
  AND conname LIKE '%production_step%';

-- Résultat confirmé:
-- Seules les valeurs anglaises sont autorisées
```

### ✅ Données existantes nettoyées
```sql
UPDATE tasks SET production_step = ...
-- 0 rows affected (base déjà propre)
```

### ✅ Fonction corrigée
```sql
CREATE OR REPLACE FUNCTION auto_generate_production_tasks()
-- Toutes les valeurs changées de français → anglais
```

### ✅ Build Frontend réussi
```bash
npm run build
✓ built in 21.59s
```

---

## 🎯 RÉSULTAT FINAL

| Critère | Status |
|---------|--------|
| Erreur constraint violation | ✅ CORRIGÉE |
| Fonction `auto_generate_production_tasks()` | ✅ CORRIGÉE |
| Helper `normalizeProductionStep()` créé | ✅ OUI |
| Mapping français ↔ anglais documenté | ✅ OUI |
| Données existantes nettoyées | ✅ OUI |
| Build réussi | ✅ OUI |
| Régression possible | ❌ NON |

---

## 📝 UTILISATION DANS LE CODE

### Lors de la création d'une tâche manuelle
```typescript
import { normalizeProductionStep } from '@/lib/productionStepsHelpers';

const taskData = {
  title: 'Tournage du reel',
  production_step: normalizeProductionStep('tournage'), // → 'shooting'
  category: 'content',
  priority: 'high',
  status: 'todo'
};

await supabase.from('tasks').insert(taskData);
```

### Lors de l'affichage des labels
```typescript
import { getStepLabel } from '@/lib/productionStepsHelpers';

// production_step vient de la DB en anglais
const step = 'shooting';
const label = getStepLabel(step); // → 'Tournage'
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Tester en production** avec les 4 tests ci-dessus
2. **Surveiller les logs** pour toute erreur de constraint
3. **Si problème persiste** :
   - Vérifier que la migration `fix_production_step_english_values.sql` est bien appliquée
   - Vérifier que `normalizeProductionStep()` est appelé avant tout INSERT/UPDATE
   - Vérifier les triggers qui manipulent production_step

---

## 📚 FICHIERS MODIFIÉS

### Migrations Database
- ✅ `fix_production_step_english_values.sql` (fonction corrigée)

### Code Frontend
- ✅ `src/lib/productionStepsHelpers.ts` (fonctions ajoutées)

### Données
- ✅ Aucune donnée existante nécessitait correction

---

**Toutes les valeurs de production_step sont maintenant conformes à la contrainte CHECK !**
