# Correction Contrainte legal_status

## Problème

Lors de la modification du statut légal dans les paramètres (Profil de l'entreprise), l'erreur suivante se produisait :

```
Erreur lors de la sauvegarde du profil: new row for relation "company_profiles" violates check constraint "company_profiles_legal_status_check"
```

## Cause

Le formulaire utilisait des valeurs TypeScript différentes de celles attendues par la base de données :

### Valeurs Frontend (TypeScript)
- `MICRO` - Micro-entreprise
- `EI` - Entreprise individuelle
- `SASU_EURL` - SASU/EURL
- `OTHER` - Autre statut

### Valeurs Base de Données
- `auto_entreprise` - Micro-entreprise
- `entreprise_individuelle` - Entreprise individuelle
- `sasu_eurl` - SASU/EURL
- `autre` - Autre statut

La contrainte SQL définie dans la migration `20260122203200_make_company_profile_fields_optional_v2.sql` :

```sql
ALTER TABLE company_profiles
  ADD CONSTRAINT company_profiles_legal_status_check
  CHECK (legal_status IS NULL OR legal_status IN ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl', 'autre'));
```

## Solution

Création de fonctions de mapping pour convertir entre les formats :

### 1. Conversion Frontend → Base de données

```typescript
const legalStatusToDb = (status: LegalStatus): string | null => {
  const mapping: Record<string, string> = {
    'MICRO': 'auto_entreprise',
    'EI': 'entreprise_individuelle',
    'SASU_EURL': 'sasu_eurl',
    'OTHER': 'autre'
  };
  return status ? mapping[status] || null : null;
};
```

### 2. Conversion Base de données → Frontend

```typescript
const legalStatusFromDb = (status: string | null): LegalStatus => {
  const mapping: Record<string, LegalStatus> = {
    'auto_entreprise': 'MICRO',
    'entreprise_individuelle': 'EI',
    'sasu_eurl': 'SASU_EURL',
    'autre': 'OTHER'
  };
  return status ? mapping[status] || '' : '';
};
```

### 3. Application des conversions

**Lors du chargement du profil :**
```typescript
setProfile({
  ...data,
  legal_status: legalStatusFromDb(data.legal_status),
  // ... autres champs
});
```

**Lors de la sauvegarde du profil :**
```typescript
const { error } = await supabase
  .from('company_profiles')
  .upsert({
    ...profile,
    legal_status: legalStatusToDb(profile.legal_status),
    // ... autres champs
  });
```

## Fichiers Modifiés

- `src/components/settings/CompanyProfileForm.tsx`
  - Ajout des fonctions `legalStatusToDb` et `legalStatusFromDb`
  - Modification de `loadProfile` pour convertir depuis la base de données
  - Modification de `saveProfile` pour convertir vers la base de données

## Tests

- ✅ Build du projet réussi
- ✅ Pas d'erreur TypeScript
- ✅ La conversion bidirectionnelle fonctionne correctement

## Impact

Cette correction permet de :
- Maintenir la cohérence entre le code TypeScript et la base de données
- Éviter les erreurs de contrainte SQL
- Préserver la lisibilité du code frontend avec des constantes TypeScript explicites
- Respecter la convention de nommage de la base de données (snake_case, minuscules)

## Note Technique

Cette approche de mapping est une bonne pratique car elle :
1. Sépare les préoccupations (frontend vs backend)
2. Permet de changer les valeurs d'un côté sans impacter l'autre
3. Facilite la maintenance et la compréhension du code
4. Évite les erreurs de typage grâce à TypeScript
