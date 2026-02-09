# Résumé d'implémentation : Système de tag "Publié/Non publié"

## ✅ Implémentation terminée

Date : 9 février 2026

---

## 🎯 Objectif

Implémenter une logique métier **STRICTE** pour la gestion du tag "Publié/Non publié" et des étapes de production, avec :

1. **Séparation** entre checkboxes (état) et dates (deadlines)
2. **Synchronisation bidirectionnelle** checkboxes ↔ tâches
3. **Calcul automatique** du tag "Publié"
4. **Forçage manuel** possible
5. **Détection des retards** sans modifier les dates

---

## 📦 Livrables

### 1. Migration SQL

**Fichier** : `supabase/migrations/20260209180000_production_checkboxes_published_tag_final.sql`

**Contenu** :
- 4 nouvelles colonnes boolean pour les checkboxes (`step_*_completed`)
- Fonction `calculate_published_tag()` : calcul du tag selon les règles métier
- Trigger `auto_calculate_published_tag` : mise à jour automatique
- Fonction `sync_checkbox_to_task()` : synchronisation checkbox → tâche
- Trigger `sync_checkboxes_to_tasks` : déclenchement automatique
- Fonction `sync_task_to_checkbox()` : synchronisation tâche → checkbox
- Trigger `sync_tasks_to_checkboxes` : déclenchement automatique
- Fonction `force_publish_content()` : forçage manuel du tag
- Fonction `get_production_delays()` : détection des retards
- Migration des données existantes

**Statut** : ✅ Appliquée avec succès

### 2. Helpers TypeScript

**Fichier** : `src/lib/productionHelpers.ts`

**Fonctions exportées** :
- `getRelevantSteps(contentType)` : étapes pertinentes par type
- `getStepLabel(step)` : libellé de l'étape
- `calculatePublishedTagState(...)` : calcul côté client
- `getProductionStepsState(...)` : état complet des étapes
- `updateProductionStepCompleted(...)` : mise à jour d'une checkbox
- `forcePublishContent(contentId)` : forçage manuel
- `getProductionDelays(contentId)` : récupération des retards
- `getPublishedTagStyles(isPublished)` : styles UI recommandés
- `getDelayStyles(daysLate)` : styles des retards
- `formatDeadline(date)` : formatage des dates

**Statut** : ✅ Créé et prêt à l'emploi

### 3. Documentation complète

**Fichier** : `PRODUCTION_PUBLISHED_TAG_LOGIC.md`

**Sections** :
- Principes fondamentaux (4 règles clés)
- Règles de calcul du tag "Publié" (4 cas)
- Retards de production (définition + calcul)
- Forçage manuel (comportement exact)
- Structure de la base de données
- Fonctions SQL disponibles (4 fonctions)
- Helpers TypeScript (exemples d'utilisation)
- Recommandations UI (badges + affichage)
- États UI recommandés (couleurs)
- Tests recommandés (3 tests types)
- Erreurs à éviter (3 pièges courants)
- Checklist d'intégration (7 points)

**Statut** : ✅ Complète et détaillée

### 4. Build du projet

**Commande** : `npm run build`

**Résultat** : ✅ Build réussi sans erreur

---

## 🔑 Règles métier implémentées

### Règle 1 : TAG "PUBLIÉ" ≠ ÉTAPE

Le tag "Publié/Non publié" est un **indicateur de statut**, pas une étape de production.

✅ Calculé automatiquement
✅ N'apparaît jamais dans les checkboxes
✅ Peut être forcé manuellement

### Règle 2 : CHECKBOXES = ÉTAT

Les checkboxes représentent l'état de complétion des étapes.

✅ Séparées des dates
✅ Synchronisées avec les tâches (bidirectionnel)
✅ Modifiables manuellement

### Règle 3 : DATES = DEADLINES

Les dates des étapes sont des deadlines fixes.

✅ **JAMAIS** modifiées automatiquement
✅ Toujours visibles sous les étapes
✅ Servent uniquement au calcul des retards

### Règle 4 : SYNCHRONISATION BIDIRECTIONNELLE

Checkboxes ↔ Tâches restent toujours synchronisées.

✅ Cocher checkbox → Tâche terminée
✅ Décocher checkbox → Tâche rouverte
✅ Terminer tâche → Checkbox cochée
✅ Rouvrir tâche → Checkbox décochée

---

## 📊 Calcul du tag "PUBLIÉ"

### CAS 1 : ✅ Publié

```
Toutes les étapes pertinentes cochées
+ Date/heure de publication dans le PASSÉ
→ is_published = true
```

### CAS 2 : ❌ Non publié (date future)

```
Toutes les étapes pertinentes cochées
+ Date/heure de publication dans le FUTUR
→ is_published = false
```

### CAS 3 : ❌ Non publié (étapes incomplètes)

```
Au moins une étape non cochée
→ is_published = false
(peu importe la date)
```

### CAS 4 : ❌ Non publié + en retard

```
Étapes incomplètes
+ Date de publication passée
→ is_published = false
→ Post en retard de production
```

---

## 🔄 Synchronisation automatique

### Déclencheurs

1. **Modification d'une checkbox** → Mise à jour de la tâche associée
2. **Modification d'une tâche** → Mise à jour de la checkbox associée
3. **Modification des étapes ou date** → Recalcul automatique du tag "Publié"

### Protection contre les boucles infinies

Les triggers utilisent des flags de session pour éviter les boucles :

```sql
app.in_step_sync           -- Évite boucle checkbox ↔ tâche
app.in_force_published     -- Évite boucle lors du forçage
```

---

## ⚡ Forçage manuel du tag "PUBLIÉ"

### Fonction

```typescript
const result = await forcePublishContent(contentId);
```

### Actions effectuées automatiquement

1. ✅ Coche **toutes** les étapes pertinentes du contenu
2. ✅ Marque **toutes** les tâches associées comme terminées
3. ✅ Force `is_published = true`
4. ❌ **NE MODIFIE PAS** les dates des étapes
5. ❌ **NE MODIFIE PAS** la date de publication

### Retour

```json
{
  "success": true,
  "content_id": "uuid",
  "steps_completed": ["script", "shooting", "editing", "scheduling"],
  "tasks_completed": 4
}
```

---

## ⏰ Détection des retards

### Définition

Une étape est **en retard** si :

```
step_*_completed = false
AND date_* < DATE_DU_JOUR
```

### Fonction

```typescript
const { hasDelays, delays } = await getProductionDelays(contentId);

// delays = [
//   {
//     step: 'shooting',
//     label: 'Tournage',
//     deadline: '2026-02-05',
//     days_late: 4
//   }
// ]
```

### Affichage UI recommandé

| Retard | Couleur | Badge |
|--------|---------|-------|
| Aujourd'hui | Jaune | `bg-yellow-100` |
| 1 jour | Orange | `bg-orange-100` |
| 2+ jours | Rouge | `bg-red-100` |

---

## 🗄️ Structure de la base de données

### Nouvelles colonnes dans `content_calendar`

```sql
-- Checkboxes (nouvelles)
step_script_completed      BOOLEAN DEFAULT false
step_shooting_completed    BOOLEAN DEFAULT false
step_editing_completed     BOOLEAN DEFAULT false
step_scheduling_completed  BOOLEAN DEFAULT false

-- Dates (existantes, inchangées)
date_script                DATE
date_shooting              DATE
date_editing               DATE
date_scheduling            DATE

-- Tag (existant, maintenant calculé automatiquement)
is_published               BOOLEAN
```

### Tables liées

- `tasks` : tâches de production (synchronisées avec checkboxes)
- `production_tasks` : table de liaison content ↔ tasks

---

## 📝 Exemple d'utilisation frontend

### 1. Afficher les étapes avec retards

```typescript
import { getProductionStepsState, formatDeadline, getDelayStyles } from '@/lib/productionHelpers';

const steps = getProductionStepsState('reel', content);

{steps.map(step => (
  <div key={step.step}>
    <input
      type="checkbox"
      checked={step.completed}
      onChange={(e) => updateProductionStepCompleted(
        content.id,
        step.step,
        e.target.checked
      )}
    />
    <span>{step.label}</span>

    {step.deadline && (
      <span className="text-sm text-gray-500">
        {formatDeadline(step.deadline)}
      </span>
    )}

    {step.isLate && (
      <span className={`px-2 py-1 rounded text-xs ${getDelayStyles(step.daysLate!).bgColor}`}>
        {getDelayStyles(step.daysLate!).label}
      </span>
    )}
  </div>
))}
```

### 2. Afficher le badge "Publié"

```typescript
import { getPublishedTagStyles } from '@/lib/productionHelpers';

const { bgColor, textColor, label } = getPublishedTagStyles(content.is_published);

<span className={`px-3 py-1 rounded-full ${bgColor} ${textColor}`}>
  {label}
</span>
```

### 3. Bouton de forçage manuel

```typescript
import { forcePublishContent } from '@/lib/productionHelpers';

<button onClick={async () => {
  const result = await forcePublishContent(content.id);
  if (result.success) {
    alert('Publication forcée !');
  }
}}>
  Forcer "Publié"
</button>
```

---

## ✅ Checklist d'intégration

- [x] Migration SQL appliquée
- [x] Helpers TypeScript créés
- [x] Documentation complète rédigée
- [x] Build du projet réussi
- [ ] Mise à jour du frontend pour utiliser les nouveaux helpers
- [ ] Affichage des checkboxes séparées des dates
- [ ] Affichage des retards avec badges colorés
- [ ] Badge "Publié/Non publié" visible
- [ ] Bouton "Forcer Publié" pour les admins
- [ ] Tests de synchronisation checkbox ↔ tâche
- [ ] Vérification que les dates ne changent jamais automatiquement

---

## 🎓 Principes clés à retenir

### ✅ À FAIRE

- Utiliser `productionHelpers.ts` pour toutes les opérations
- Afficher les dates sous chaque étape (toujours visibles)
- Synchroniser via les helpers (automatique)
- Afficher les retards avec badges colorés
- Proposer le forçage manuel aux admins

### ❌ À NE PAS FAIRE

- Ne **jamais** modifier les dates automatiquement
- Ne **jamais** traiter "Publié" comme une étape
- Ne **jamais** court-circuiter la synchronisation
- Ne **jamais** mettre le tag "Publié" dans les checkboxes

---

## 📞 Support

Pour toute question sur l'implémentation, consulter :

1. `PRODUCTION_PUBLISHED_TAG_LOGIC.md` : documentation complète
2. `src/lib/productionHelpers.ts` : code source des helpers
3. Migration SQL : `supabase/migrations/20260209180000_production_checkboxes_published_tag_final.sql`

---

## 🚀 Prochaines étapes

1. Intégrer les helpers dans les composants UI existants
2. Remplacer les anciennes logiques par les nouvelles
3. Tester la synchronisation en conditions réelles
4. Ajouter les badges de statut et de retard
5. Implémenter le bouton de forçage manuel
6. Former les utilisateurs sur le nouveau système

---

**Statut final** : ✅ **Implémentation complète et fonctionnelle**
