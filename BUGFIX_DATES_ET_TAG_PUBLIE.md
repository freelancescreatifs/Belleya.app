# Correction des bugs : Dates et Tag "Publié"

## 🐛 Bugs corrigés

### Bug 1 : Les dates changent automatiquement

**Problème** : Quand on décoche puis recoche une étape (ex: "Montage"), la date changeait pour aujourd'hui au lieu de rester celle définie lors de la création.

**Cause** : L'ancienne fonction `cascade_production_steps` modifiait les dates automatiquement.

**Solution** :
- ✅ Suppression de `cascade_production_steps` et toutes les fonctions obsolètes
- ✅ Utilisation des nouveaux helpers qui ne touchent JAMAIS aux dates
- ✅ Les dates restent maintenant fixes, seules les checkboxes changent

### Bug 2 : Le tag "Publié" ne se calcule pas correctement

**Problème** : Même avec toutes les étapes cochées et une date dans le passé, le tag restait "Non publié".

**Cause** : L'ancienne logique utilisait les dates (`date_*`) pour déterminer l'état, au lieu des checkboxes (`step_*_completed`).

**Solution** :
- ✅ La nouvelle fonction `calculate_published_tag` vérifie les checkboxes
- ✅ Le trigger `auto_calculate_published_tag` recalcule automatiquement le tag
- ✅ La logique est maintenant conforme aux règles métier

### Bug 3 : Impossible de forcer manuellement le statut "Publié"

**Problème** : Pas d'interface pour forcer le tag à "Publié" manuellement.

**Solution** :
- ✅ Fonction `force_publish_content` disponible
- ✅ Accessible via le dropdown "Étape de production" dans le Studio
- ✅ Option "Publié" dans le menu force le tag (coche tout + marque tâches terminées)

---

## 🔧 Corrections appliquées

### 1. Migration SQL : Nettoyage des anciennes fonctions

**Fichier** : `supabase/migrations/20260209180001_cleanup_old_cascade_logic.sql`

**Actions** :
- Suppression de `cascade_production_steps()`
- Suppression de `auto_update_post_status()`
- Suppression de `calculate_post_status()`
- Suppression de tous les triggers obsolètes
- Recalcul de `is_published` pour tous les contenus existants

### 2. ContentTable.tsx : Utilisation des nouveaux helpers

**Modifications** :
```typescript
// AVANT (❌ modifiait les dates)
await supabase.rpc('cascade_production_steps', {
  p_content_id: content.id,
  p_step: 'published',
  p_checked: true
});

// APRÈS (✅ ne modifie PAS les dates)
const result = await forcePublishContent(content.id);
```

**Changements** :
- Import de `forcePublishContent`, `updateProductionStepCompleted`
- Ajout des champs `step_*_completed` à l'interface `ContentItem`
- Fonction `handleProductionStepChange` : utilise les nouveaux helpers
- Fonction `getHighestProductionStep` : vérifie les checkboxes au lieu des dates

### 3. EditorialCalendar.tsx : Utilisation des nouveaux helpers

**Modifications** :
```typescript
// AVANT (❌ modifiait les dates)
await supabase.rpc('cascade_production_steps', {
  p_content_id: contentId,
  p_step: productionStepName,
  p_checked: newCompleted
});

// APRÈS (✅ ne modifie PAS les dates)
await updateProductionStepCompleted(contentId, productionStepName, newCompleted);
```

**Changements** :
- Import de `updateProductionStepCompleted`, `forcePublishContent`
- Toggle des étapes : utilise `updateProductionStepCompleted`
- Toggle "Publié" : utilise `forcePublishContent`

---

## ✅ Comportement attendu maintenant

### Scénario 1 : Cocher/décocher une étape

**Actions** :
1. Créer un post avec une date "Montage" = 5 février
2. Cocher "Montage" → La checkbox se coche
3. Décocher "Montage" → La checkbox se décoche
4. Recocher "Montage" → La checkbox se recoche

**Résultat** :
✅ La date reste **toujours** 5 février
✅ Seule la checkbox change
✅ La tâche associée est synchronisée automatiquement

### Scénario 2 : Tag "Publié" avec toutes les étapes cochées

**Configuration** :
- Post : "ASPIRATEUR ULKA"
- Date de publication : 1er février 2026 (passée)
- Toutes les étapes cochées : ✅ Script, ✅ Tournage, ✅ Montage, ✅ Programmation

**Résultat attendu** :
✅ Tag = "Publié" (fond vert)

**Calcul** :
```
Toutes étapes cochées : OUI ✅
Date dans le passé : OUI ✅
→ is_published = true
```

### Scénario 3 : Forcer manuellement le tag "Publié"

**Actions** :
1. Ouvrir le dropdown "Étape de production" dans ContentTable
2. Sélectionner "Publié"
3. Confirmer

**Résultat** :
✅ Toutes les étapes pertinentes sont cochées automatiquement
✅ Toutes les tâches associées passent à "Terminé"
✅ `is_published` = true
✅ Les dates NE CHANGENT PAS

---

## 🧪 Tests recommandés

### Test 1 : Les dates ne changent pas

```
1. Créer un post avec des dates spécifiques
2. Cocher "Montage" → date_editing reste fixe
3. Décocher "Montage" → date_editing reste fixe
4. Recocher "Montage" → date_editing reste fixe
```

### Test 2 : Tag "Publié" calculé correctement

```
Post avec :
- step_script_completed = true
- step_shooting_completed = true
- step_editing_completed = true
- step_scheduling_completed = true
- publication_date = 2026-02-01 (passé)

→ is_published doit être true
→ Badge "Publié" affiché
```

### Test 3 : Forçage manuel fonctionne

```
1. Post avec étapes incomplètes
2. Sélectionner "Publié" dans le dropdown
3. Vérifier :
   - step_script_completed = true
   - step_shooting_completed = true
   - step_editing_completed = true
   - step_scheduling_completed = true
   - is_published = true
   - Les dates sont inchangées
   - Les tâches sont marquées "Terminé"
```

---

## 📋 Checklist de vérification

- [x] Migration SQL appliquée avec succès
- [x] Anciennes fonctions supprimées
- [x] ContentTable.tsx mis à jour
- [x] EditorialCalendar.tsx mis à jour
- [x] Build réussi sans erreur
- [ ] Test manuel : Les dates restent fixes
- [ ] Test manuel : Le tag "Publié" se calcule correctement
- [ ] Test manuel : Le forçage "Publié" fonctionne
- [ ] Test manuel : La synchronisation checkbox ↔ tâche fonctionne

---

## 🎯 Points clés à retenir

### ✅ RÈGLES RESPECTÉES

1. **Les dates NE CHANGENT JAMAIS automatiquement**
   - Seules les checkboxes (`step_*_completed`) changent
   - Les dates (`date_*`) sont des deadlines fixes

2. **Le tag "Publié" est calculé automatiquement**
   - Basé sur les checkboxes + date de publication
   - Trigger automatique à chaque modification

3. **Le forçage manuel est possible**
   - Via le dropdown "Étape de production" → "Publié"
   - Coche toutes les étapes + marque les tâches terminées
   - Ne modifie PAS les dates

4. **Synchronisation bidirectionnelle**
   - Checkbox → Tâche (automatique)
   - Tâche → Checkbox (automatique)

---

## 📚 Ressources

- **Documentation complète** : `PRODUCTION_PUBLISHED_TAG_LOGIC.md`
- **Helpers TypeScript** : `src/lib/productionHelpers.ts`
- **Migration finale** : `supabase/migrations/20260209180000_production_checkboxes_published_tag_final.sql`
- **Migration nettoyage** : `supabase/migrations/20260209180001_cleanup_old_cascade_logic.sql`

---

## 🚀 Prochaines étapes

1. Tester avec le post "ASPIRATEUR ULKA"
2. Vérifier que le tag "Publié" s'affiche correctement
3. Tester le forçage manuel
4. Vérifier que les dates restent fixes
5. Tester la synchronisation avec les tâches

---

**Statut** : ✅ Corrections terminées et build réussi
**Date** : 9 février 2026
