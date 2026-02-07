# Amélioration module Élèves - Vue cartes et documents par étapes

## Vue d'ensemble

Transformation complète de l'onglet "Élèves" avec :
1. ✅ Vue en cartes (comme l'onglet Clientes)
2. ✅ Système de documents par étapes de formation enrichi
3. ✅ Type "Autres" pour documents personnalisés
4. ✅ Fonctionnalité de renommage de documents
5. ✅ Correction du bucket de stockage

## 1. Vue en cartes des élèves

### Avant
- Table en lignes avec colonnes multiples
- Difficile à lire sur mobile
- Actions cachées dans des boutons

### Après
- **Grille de cartes responsive** (1-4 colonnes selon l'écran)
- Carte avec photo/avatar circulaire en haut
- Informations essentielles visibles
- Actions (modifier/supprimer) au survol
- Design moderne et cohérent avec l'onglet Clientes

### Structure d'une carte élève
```
┌─────────────────────────┐
│  [Photo de l'élève]     │ ← Avatar circulaire avec gradient
│  [✏️ 🗑️]                 │ ← Actions au survol
├─────────────────────────┤
│  Prénom Nom             │ ← Nom centré
│  email@example.com      │ ← Email (tronqué si long)
├─────────────────────────┤
│  [Badge statut]         │ ← En cours / À venir / Terminé
│  [Formation 1] [+2]     │ ← Formations (max 2 visibles)
├─────────────────────────┤
│  Prochaine: 15 janv     │ ← Prochaine date de formation
│  Dossier: Complet ✅    │ ← État du dossier
└─────────────────────────┘
```

## 2. Système de documents par étapes

### Structure des étapes

#### 📋 Avant la formation
Documents requis :
- ✅ **Contrat signé** (obligatoire)
- ✅ **Devis signé** (obligatoire)
- ✅ **Règlement intérieur signé** (obligatoire)
- 📄 **Autre document** (optionnel, multiple)

#### 📚 Pendant la formation
Documents requis :
- ✅ **Évaluation des acquis** (obligatoire)
- ✅ **Questionnaire de satisfaction** (obligatoire)
- 📄 **Autre document** (optionnel, multiple)

#### 🎓 Après la formation
Documents :
- 📄 **Autre document** (optionnel, multiple)

### Type "Autres"
Le type "Autres" permet d'ajouter des documents personnalisés à chaque étape :
- **Multiples documents** : Vous pouvez ajouter autant de documents "Autres" que nécessaire
- **Exemples d'usage** :
  - Attestations diverses
  - Photos de réalisations
  - Factures supplémentaires
  - Certificats médicaux
  - Documents administratifs spécifiques
  - Notes de formation
  - etc.

## 3. Fonctionnalités de gestion des documents

### 📤 Upload de documents

**Formats acceptés** : PDF, JPG, JPEG, PNG, DOC, DOCX

**Comment uploader** :
1. Cliquer sur l'élève pour ouvrir son profil
2. Descendre à la section "Documents"
3. Choisir l'étape (Avant / Pendant / Après)
4. Cliquer sur "Ajouter" pour les documents requis
5. Cliquer sur "+ Autre document" pour ajouter un document personnalisé

**Stockage** :
- Tous les documents sont stockés dans le bucket `student-documents` de Supabase Storage
- Organisation : `{user_id}/students/{student_id}/{timestamp}.{extension}`
- URLs publiques générées automatiquement

### ✏️ Renommer un document

**Pour tous les documents (requis ou "autres")** :
1. Cliquer sur le bouton **✏️ (Renommer)**
2. Saisir le nouveau nom dans la popup
3. Valider
4. Le nom personnalisé s'affiche immédiatement

**Cas d'usage** :
- "Contrat signé" → "Contrat Marie Dupont - 2024"
- "Document 123456.pdf" → "Attestation formation prothésiste"
- "IMG_4521.jpg" → "Photo nail art jour 3"

### 👁️ Voir/Télécharger un document

Cliquer sur le bouton **📄 (Télécharger)** :
- Ouvre le document dans un nouvel onglet
- Possibilité de télécharger le fichier
- Fonctionne pour tous les types de fichiers

### 🗑️ Supprimer un document

Cliquer sur le bouton **🗑️ (Supprimer)** :
- Confirmation de sécurité
- Supprime le document de la base de données
- Supprime le fichier du stockage Supabase
- Irréversible

## 4. Interface utilisateur détaillée

### Documents standards (requis)

```
┌─────────────────────────────────────────────────────┐
│ 📄 Contrat signé                                    │
│    contrat_marie_dupont.pdf                         │
│    15/01/2024                                       │
│                            [✏️] [📄] [🗑️]           │
└─────────────────────────────────────────────────────┘
```

### Documents manquants (requis)

```
┌─────────────────────────────────────────────────────┐
│ 📄 Devis signé                                      │
│    [⚠️ Manquant]                                    │
│                                      [+ Ajouter]    │
└─────────────────────────────────────────────────────┘
```

### Documents "Autres" (vides)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│    + Autre document                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### Documents "Autres" (avec fichiers)

```
┌─────────────────────────────────────────────────────┐
│ 📄 Attestation formation nail art                   │
│    15/01/2024                                       │
│                            [✏️] [📄] [🗑️]           │
├─────────────────────────────────────────────────────┤
│ 📄 Photos réalisations jour 1                       │
│    16/01/2024                                       │
│                            [✏️] [📄] [🗑️]           │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│    + Ajouter un autre document                      │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## 5. Corrections techniques

### Bucket de stockage corrigé

**Avant** :
- ❌ Les documents étaient uploadés dans `service-photos`
- ❌ Mauvaise organisation et confusion possible

**Après** :
- ✅ Les documents sont uploadés dans `student-documents`
- ✅ Bucket dédié avec politiques RLS appropriées
- ✅ Organisation claire et séparée

### Migration de base de données

**Fichier** : `add_other_document_type_and_renaming.sql`

**Modifications** :
1. Ajout du type `'other'` dans la contrainte CHECK de `document_type`
2. Ajout de la colonne `custom_name` (nullable) pour stocker les noms personnalisés
3. Préservation de toutes les données existantes

```sql
-- Nouveau champ
ALTER TABLE student_documents
ADD COLUMN IF NOT EXISTS custom_name text;

-- Nouvelle contrainte avec 'other'
ALTER TABLE student_documents
ADD CONSTRAINT student_documents_document_type_check
CHECK (document_type IN (
  'contract', 'signed_quote', 'training_program_doc', 'signed_rules',
  'attendance_sheets', 'training_materials', 'skills_assessment',
  'satisfaction_survey', 'completion_certificate', 'invoice',
  'other'  ← NOUVEAU
));
```

## 6. Fichiers modifiés

### Frontend

#### src/pages/Training.tsx
**Changements** :
- Remplacement du tableau par une grille de cartes
- Design responsive (1-4 colonnes)
- Affichage de la photo ou avatar avec initiales
- Actions au survol
- Badges visuels pour statut et dossier
- Informations condensées et lisibles

#### src/components/training/StudentDetailDrawer.tsx
**Changements** :
- Ajout de la constante `REQUIRED_DOCUMENTS_BY_STAGE` avec le type "other"
- Modification de `handleFileUpload` : bucket `student-documents` + `custom_name`
- Modification de `handleDeleteDocument` : bucket `student-documents`
- Ajout de `handleRenameDocument` : fonction de renommage
- Remplacement de `getDocumentByType` par `getDocumentsByType` (retourne array)
- Refonte complète du rendu des documents :
  - Gestion des documents uniques (requis)
  - Gestion des documents multiples (other)
  - Affichage du `custom_name` si défini
  - Bouton de renommage pour tous les documents
  - Interface pour ajouter plusieurs documents "other"

### Base de données

#### Migration : add_other_document_type_and_renaming.sql
- Ajout du type `'other'` aux documents autorisés
- Ajout de la colonne `custom_name`
- Compatible avec les données existantes

## 7. Avantages de la nouvelle architecture

### Pour l'utilisateur PRO

1. **Vue plus claire** : Les cartes sont plus visuelles et agréables
2. **Navigation mobile** : Responsive et adapté au tactile
3. **Flexibilité** : Ajout de documents personnalisés sans limite
4. **Organisation** : Renommage pour une meilleure organisation
5. **Rapidité** : Voir l'essentiel d'un coup d'œil

### Pour le système

1. **Meilleur stockage** : Bucket dédié aux documents élèves
2. **Extensibilité** : Facile d'ajouter de nouveaux types de documents
3. **Traçabilité** : Noms personnalisés et dates d'upload
4. **Sécurité** : RLS maintenue sur tous les documents

## 8. Guide d'utilisation rapide

### Ajouter un élève
1. Cliquer sur "Nouvel élève"
2. Remplir les informations
3. L'élève apparaît en carte

### Uploader un document
1. Cliquer sur la carte de l'élève
2. Section "Documents" → Choisir l'étape
3. Cliquer "Ajouter" sur le document voulu
4. Sélectionner le fichier
5. Le document apparaît immédiatement

### Ajouter un document "Autre"
1. Dans une étape (Avant/Pendant/Après)
2. Cliquer sur "+ Autre document" (bordure pointillée)
3. Sélectionner le fichier
4. Le fichier apparaît avec son nom
5. Possibilité de le renommer ensuite
6. Cliquer à nouveau sur "+ Ajouter un autre document" pour en ajouter plus

### Renommer un document
1. Cliquer sur l'icône ✏️ (crayon)
2. Saisir le nouveau nom
3. Valider
4. Le nom change immédiatement

### Supprimer un document
1. Cliquer sur l'icône 🗑️ (poubelle)
2. Confirmer la suppression
3. Le document est supprimé définitivement

## 9. Résolution du problème d'envoi

### Problème identifié
❌ **Les documents ne pouvaient pas être uploadés** car :
- Le code utilisait le mauvais bucket (`service-photos` au lieu de `student-documents`)
- Le bucket `student-documents` existe dans la migration mais le code ne l'utilisait pas

### Solution appliquée
✅ **Correction dans `StudentDetailDrawer.tsx`** :
```typescript
// AVANT (❌ ne fonctionnait pas)
const { error: uploadError } = await supabase.storage
  .from('service-photos')  // ❌ Mauvais bucket
  .upload(fileName, file);

// APRÈS (✅ fonctionne)
const { error: uploadError } = await supabase.storage
  .from('student-documents')  // ✅ Bon bucket
  .upload(fileName, file);
```

### Test de validation
1. ✅ Upload de fichier PDF → Fonctionne
2. ✅ Upload de fichier JPG → Fonctionne
3. ✅ Upload de document "other" → Fonctionne
4. ✅ Renommage → Fonctionne
5. ✅ Téléchargement → Fonctionne
6. ✅ Suppression → Fonctionne

## 10. Prochaines améliorations possibles

### Court terme
- [ ] Drag & drop pour uploader les documents
- [ ] Prévisualisation des images dans l'interface
- [ ] Recherche par nom de document
- [ ] Export de tous les documents d'un élève en ZIP

### Moyen terme
- [ ] Templates de documents pré-remplis
- [ ] Signature électronique intégrée
- [ ] Rappels automatiques pour documents manquants
- [ ] Statistiques sur les documents (taux de complétion, etc.)

### Long terme
- [ ] OCR pour extraire les informations des documents
- [ ] Validation automatique de documents
- [ ] Archivage automatique après formation
- [ ] Intégration avec des services de signature (DocuSign, etc.)

## 11. Résumé des améliorations

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| **Affichage élèves** | Table en lignes | Cartes visuelles |
| **Responsive** | Scroll horizontal | Grille adaptative |
| **Types de documents** | 10 types fixes | 10 + "Autres" (illimité) |
| **Documents "Autres"** | ❌ Non supporté | ✅ Multiple par étape |
| **Renommage** | ❌ Impossible | ✅ Tous les documents |
| **Bucket de stockage** | ❌ service-photos | ✅ student-documents |
| **Upload fonctionnel** | ❌ Ne fonctionnait pas | ✅ Fonctionne parfaitement |
| **Nom personnalisé** | ❌ Nom du fichier uniquement | ✅ Renommage libre |
| **Actions document** | Voir, Supprimer | Renommer, Voir, Supprimer |

## 12. Support et maintenance

### En cas de problème

1. **Les documents ne s'uploadent pas** :
   - Vérifier que le bucket `student-documents` existe dans Supabase Storage
   - Vérifier les politiques RLS du bucket
   - Vérifier la taille du fichier (limite Supabase : 50MB par défaut)

2. **Les documents ne s'affichent pas** :
   - Vérifier que `document_stage` correspond bien à l'étape
   - Vérifier que le `student_id` est correct
   - Regarder les logs de la console navigateur

3. **Le renommage ne fonctionne pas** :
   - Vérifier que la migration a bien été appliquée
   - Vérifier que la colonne `custom_name` existe dans `student_documents`

### Logs utiles

Les erreurs sont loguées dans la console :
- `Error uploading file:` → Problème d'upload
- `Error deleting document:` → Problème de suppression
- `Error renaming document:` → Problème de renommage

---

**Date de mise à jour** : 1er février 2026
**Version** : 1.0
**Status** : ✅ Production Ready
