# Logique Métier : Tag "Publié/Non publié" + Étapes de Production

## Vue d'ensemble

Ce document décrit la logique métier **STRICTE** pour la gestion du tag "Publié/Non publié" et des étapes de production dans le Studio de Contenu.

---

## 📌 Principes fondamentaux

### 1. TAG "PUBLIÉ" = TAG (pas une étape)

- **C'est un indicateur de statut**, pas une étape de production
- **N'apparaît JAMAIS dans les checkboxes**
- **Calculé automatiquement** (sauf forçage manuel)
- Affiché comme un badge dans l'UI : `Publié` / `Non publié`

### 2. CHECKBOXES = État des étapes

- **Séparées des dates** (colonnes `step_*_completed`)
- Représentent si une étape est **terminée** ou non
- **Synchronisées bidirectionnellement** avec les tâches
- L'utilisateur peut cocher/décocher manuellement

### 3. DATES = Deadlines (NE CHANGENT JAMAIS automatiquement)

- **Jamais modifiées automatiquement** par le système
- **Toujours visibles** sous le nom de l'étape
- Servent uniquement à **calculer les retards**
- L'utilisateur les définit lors de la planification

### 4. SYNCHRONISATION Checkboxes ↔ Tâches

- **Cocher une checkbox** → La tâche passe à `completed = true`
- **Décocher une checkbox** → La tâche passe à `completed = false`
- **Terminer une tâche** → La checkbox se coche
- **Rouvrir une tâche** → La checkbox se décoche
- **Bidirectionnel** : les deux sources de vérité restent synchronisées

---

## 🎯 Règles de calcul du tag "PUBLIÉ"

### CAS 1 : Toutes les étapes cochées + date passée

```
✅ step_script_completed = true
✅ step_shooting_completed = true (si pertinent)
✅ step_editing_completed = true (si pertinent)
✅ step_scheduling_completed = true
✅ publication_date + publication_time <= NOW()

→ TAG = "Publié"
```

### CAS 2 : Toutes les étapes cochées + date future

```
✅ step_script_completed = true
✅ step_shooting_completed = true (si pertinent)
✅ step_editing_completed = true (si pertinent)
✅ step_scheduling_completed = true
❌ publication_date + publication_time > NOW()

→ TAG = "Non publié"
```

### CAS 3 : Une ou plusieurs étapes NON cochées

```
❌ Au moins une step_*_completed = false

→ TAG = "Non publié"
(peu importe la date de publication)
```

### CAS 4 : Date passée + étapes non cochées

```
❌ Étapes incomplètes
✅ publication_date dans le passé

→ TAG = "Non publié"
→ Le post est EN RETARD de production
```

---

## ⚠️ Retards de production

### Définition d'un retard

Une étape est **en retard** si :

```
step_*_completed = false
AND date_* < TODAY
```

### Calcul des retards

Pour chaque étape :

```sql
IF step_completed = false
   AND date_deadline IS NOT NULL
   AND date_deadline < CURRENT_DATE
THEN
   days_late = CURRENT_DATE - date_deadline
   → Étape en retard
END IF
```

### Affichage UI recommandé

| Jours de retard | Badge couleur | Texte |
|-----------------|---------------|-------|
| 0 (aujourd'hui) | Jaune | "Aujourd'hui" |
| 1 | Orange | "1 jour de retard" |
| 2+ | Rouge | "X jours de retard" |

**Important** : Les retards sont calculés **sans modifier les dates**. Les dates restent toujours celles définies initialement.

---

## 🔄 Forçage manuel du tag "Publié"

### Cas d'usage

L'utilisateur veut forcer le statut à "Publié" sans respecter la logique normale (par exemple, publication hors-système).

### Comportement

```typescript
force_publish_content(content_id)
```

**Actions effectuées :**

1. ✅ Coche **toutes** les étapes de production pertinentes
2. ✅ Marque **toutes** les tâches associées comme terminées
3. ✅ Force `is_published = true`
4. ❌ **NE MODIFIE PAS** les dates des étapes
5. ❌ **NE MODIFIE PAS** la date de publication

### Appel depuis le frontend

```typescript
import { forcePublishContent } from '@/lib/productionHelpers';

const result = await forcePublishContent(contentId);

if (result.success) {
  console.log('Publication forcée:', result.data);
  // result.data contient :
  // - steps_completed: ['script', 'shooting', 'editing', 'scheduling']
  // - tasks_completed: 4
}
```

---

## 🗄️ Structure de la base de données

### Table `content_calendar`

```sql
-- Dates des étapes (deadlines)
date_script         DATE       -- Deadline pour le script
date_shooting       DATE       -- Deadline pour le tournage
date_editing        DATE       -- Deadline pour le montage
date_scheduling     DATE       -- Deadline pour la programmation

-- Checkboxes des étapes (état terminé/non terminé)
step_script_completed      BOOLEAN DEFAULT false
step_shooting_completed    BOOLEAN DEFAULT false
step_editing_completed     BOOLEAN DEFAULT false
step_scheduling_completed  BOOLEAN DEFAULT false

-- Tag "Publié" (calculé automatiquement)
is_published        BOOLEAN    -- true = Publié, false = Non publié

-- Date de publication
publication_date    DATE
publication_time    TEXT
```

### Table `tasks`

```sql
completed           BOOLEAN    -- true si la tâche est terminée
completed_at        TIMESTAMPTZ
last_completed_date DATE
status              TEXT       -- 'todo', 'in_progress', 'on_hold', 'completed'
```

### Table de liaison `production_tasks`

```sql
content_id          UUID       -- Lien vers content_calendar
task_id             UUID       -- Lien vers tasks
production_step     TEXT       -- 'script', 'shooting', 'editing', 'scheduling'
```

---

## 🔧 Fonctions SQL disponibles

### 1. `calculate_published_tag(...)`

Calcule le tag "Publié/Non publié" selon les règles métier.

```sql
SELECT calculate_published_tag(
  content_id,
  content_type,
  publication_date,
  publication_time,
  step_script_completed,
  step_shooting_completed,
  step_editing_completed,
  step_scheduling_completed
);
-- Retourne: BOOLEAN (true = Publié)
```

### 2. `force_publish_content(content_id)`

Force le tag à "Publié" manuellement.

```sql
SELECT force_publish_content('uuid-du-contenu');
-- Retourne: JSONB avec steps_completed et tasks_completed
```

### 3. `get_production_delays(content_id)`

Récupère les retards de production.

```sql
SELECT get_production_delays('uuid-du-contenu');
-- Retourne: JSONB avec has_delays et array de delays
```

### 4. `get_relevant_production_steps(content_type)`

Retourne les étapes pertinentes selon le type de contenu.

```sql
SELECT get_relevant_production_steps('reel');
-- Retourne: ARRAY['script', 'shooting', 'editing', 'scheduling']

SELECT get_relevant_production_steps('story');
-- Retourne: ARRAY['script', 'shooting', 'scheduling']

SELECT get_relevant_production_steps('post');
-- Retourne: ARRAY['script', 'scheduling']
```

---

## 📦 Helpers TypeScript

### Import

```typescript
import {
  getRelevantSteps,
  getProductionStepsState,
  calculatePublishedTagState,
  updateProductionStepCompleted,
  forcePublishContent,
  getProductionDelays,
  getPublishedTagStyles,
  getDelayStyles,
  formatDeadline
} from '@/lib/productionHelpers';
```

### Exemples d'utilisation

#### 1. Afficher les étapes de production

```typescript
const steps = getProductionStepsState('reel', {
  date_script: '2026-02-01',
  date_shooting: '2026-02-05',
  date_editing: '2026-02-08',
  date_scheduling: '2026-02-10',
  step_script_completed: true,
  step_shooting_completed: false,
  step_editing_completed: false,
  step_scheduling_completed: false
});

// steps = [
//   {
//     step: 'script',
//     label: 'Script',
//     completed: true,
//     deadline: '2026-02-01',
//     isLate: false
//   },
//   {
//     step: 'shooting',
//     label: 'Tournage',
//     completed: false,
//     deadline: '2026-02-05',
//     isLate: true,
//     daysLate: 4  // Si on est le 9 février
//   },
//   // ...
// ]
```

#### 2. Cocher/décocher une étape

```typescript
// Cocher l'étape "script"
await updateProductionStepCompleted(contentId, 'script', true);

// Décocher l'étape "shooting"
await updateProductionStepCompleted(contentId, 'shooting', false);

// → Les tâches associées sont automatiquement synchronisées
```

#### 3. Calculer le tag "Publié" côté client

```typescript
const tagState = calculatePublishedTagState(
  'reel',
  '2026-02-10',
  '18:00',
  true,  // script
  true,  // shooting
  true,  // editing
  false  // scheduling
);

// tagState = {
//   isPublished: false,
//   reason: 'steps_incomplete',
//   missingSteps: ['Programmation']
// }
```

#### 4. Afficher les retards

```typescript
const { hasDelays, delays } = await getProductionDelays(contentId);

if (hasDelays) {
  delays.forEach(delay => {
    console.log(`${delay.label} : ${delay.days_late} jours de retard`);
    // "Tournage : 4 jours de retard"
  });
}
```

#### 5. Forcer la publication

```typescript
const result = await forcePublishContent(contentId);

if (result.success) {
  alert(`Publication forcée : ${result.data.tasks_completed} tâches terminées`);
}
```

---

## 🎨 Recommandations UI

### Badge "Publié/Non publié"

```tsx
const { bgColor, textColor, label } = getPublishedTagStyles(content.is_published);

<span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
  {label}
</span>
```

### Affichage des étapes

```tsx
{steps.map(step => (
  <div key={step.step} className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={step.completed}
      onChange={(e) => updateProductionStepCompleted(contentId, step.step, e.target.checked)}
    />
    <span>{step.label}</span>

    {step.deadline && (
      <span className="text-sm text-gray-500">
        {formatDeadline(step.deadline)}
      </span>
    )}

    {step.isLate && (
      <span className={`px-2 py-0.5 rounded text-xs ${getDelayStyles(step.daysLate!).bgColor} ${getDelayStyles(step.daysLate!).textColor}`}>
        {getDelayStyles(step.daysLate!).label}
      </span>
    )}
  </div>
))}
```

### Bouton de forçage manuel

```tsx
<button
  onClick={() => forcePublishContent(contentId)}
  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
  title="Forcer le statut à Publié (coche toutes les étapes et marque les tâches comme terminées)"
>
  Forcer "Publié"
</button>
```

---

## ✅ États UI recommandés

### Badge "Publié"

- Fond : `bg-green-100`
- Texte : `text-green-800`
- Label : "Publié"

### Badge "Non publié"

- Fond : `bg-gray-100`
- Texte : `text-gray-800`
- Label : "Non publié"

### Étape en retard (aujourd'hui)

- Fond : `bg-yellow-100`
- Texte : `text-yellow-800`
- Label : "Aujourd'hui"

### Étape en retard (1 jour)

- Fond : `bg-orange-100`
- Texte : `text-orange-800`
- Label : "1 jour de retard"

### Étape en retard (2+ jours)

- Fond : `bg-red-100`
- Texte : `text-red-800`
- Label : "X jours de retard"

---

## 🧪 Tests recommandés

### Test 1 : Calcul tag "Publié"

```typescript
// Toutes étapes cochées + date passée
expect(calculatePublishedTagState(
  'reel', '2026-01-01', '12:00',
  true, true, true, true
).isPublished).toBe(true);

// Toutes étapes cochées + date future
expect(calculatePublishedTagState(
  'reel', '2027-12-31', '12:00',
  true, true, true, true
).isPublished).toBe(false);

// Étapes incomplètes
expect(calculatePublishedTagState(
  'reel', '2026-01-01', '12:00',
  true, false, true, true
).isPublished).toBe(false);
```

### Test 2 : Synchronisation checkbox → tâche

```typescript
// 1. Cocher une checkbox
await updateProductionStepCompleted(contentId, 'script', true);

// 2. Vérifier que la tâche est terminée
const { data: task } = await supabase
  .from('tasks')
  .select('completed')
  .eq('id', taskId)
  .single();

expect(task.completed).toBe(true);
```

### Test 3 : Forçage manuel

```typescript
const result = await forcePublishContent(contentId);

// Vérifier que toutes les étapes sont cochées
const { data: content } = await supabase
  .from('content_calendar')
  .select('step_script_completed, step_shooting_completed, step_editing_completed, step_scheduling_completed, is_published')
  .eq('id', contentId)
  .single();

expect(content.step_script_completed).toBe(true);
expect(content.step_shooting_completed).toBe(true);
expect(content.step_editing_completed).toBe(true);
expect(content.step_scheduling_completed).toBe(true);
expect(content.is_published).toBe(true);

// Vérifier que les dates n'ont PAS changé
const { data: contentDates } = await supabase
  .from('content_calendar')
  .select('date_script, date_shooting, date_editing, date_scheduling')
  .eq('id', contentId)
  .single();

// Les dates doivent être identiques à avant
```

---

## 🚫 Erreurs à éviter

### ❌ Modifier les dates automatiquement

```typescript
// MAUVAIS : Ne jamais faire ça
await supabase
  .from('content_calendar')
  .update({ date_script: new Date().toISOString() })
  .eq('id', contentId);
```

### ❌ Traiter "Publié" comme une étape

```typescript
// MAUVAIS : "Publié" n'est PAS une étape
const steps = ['script', 'shooting', 'editing', 'published'];  // ❌
```

### ❌ Désynchroniser les checkboxes et les tâches

```typescript
// MAUVAIS : Ne jamais modifier directement sans passer par les helpers
await supabase
  .from('content_calendar')
  .update({ step_script_completed: true })
  .eq('id', contentId);

// Sans mettre à jour la tâche associée manuellement
// → La synchronisation se fera automatiquement via trigger
```

---

## 📝 Checklist d'intégration

- [ ] Utiliser `productionHelpers.ts` pour toutes les opérations
- [ ] Afficher les dates sous chaque étape (toujours visibles)
- [ ] Afficher les retards en rouge/orange/jaune selon l'urgence
- [ ] Badge "Publié/Non publié" visible (pas dans les checkboxes)
- [ ] Bouton "Forcer Publié" disponible pour les admins
- [ ] Tests de synchronisation checkbox ↔ tâche
- [ ] Vérifier que les dates ne changent JAMAIS automatiquement

---

## 🔗 Fichiers concernés

- **Migration** : `supabase/migrations/20260209180000_production_checkboxes_published_tag_final.sql`
- **Helpers TypeScript** : `src/lib/productionHelpers.ts`
- **Documentation** : `PRODUCTION_PUBLISHED_TAG_LOGIC.md` (ce fichier)
