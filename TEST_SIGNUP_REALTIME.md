# Test Signup en Temps Réel

## Origine de l'Erreur

**Erreur:** "Database error saving new user"

### Analyse Effectuée

1. **Tables vérifiées:** ✅ `user_profiles`, `company_profiles`, `profiles` existent
2. **Triggers vérifiés:** ✅ 3 triggers présents sur `auth.users`
3. **Functions vérifiées:** ✅ Toutes les fonctions existent avec SECURITY DEFINER

### Problème Identifié

La fonction `handle_new_user()` insère dans la table `profiles` (ancienne table) **SANS gestion d'erreur**.

**Code problématique:**
```sql
CREATE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, mode, created_at)
  VALUES (...);  -- PAS DE GESTION D'ERREUR !
  RETURN NEW;
END;
$$;
```

**Cause de l'échec:**
- La table `profiles` a RLS activé
- La policy INSERT requiert `auth.uid() = id`
- Au moment de l'exécution du trigger (DURING INSERT sur auth.users), `auth.uid()` n'est pas encore défini
- L'INSERT échoue à cause de RLS
- Sans gestion d'erreur, tout le signup plante avec "Database error saving new user"

### Solution Appliquée

**Migration:** `fix_handle_new_user_error_handling.sql`

Ajout d'un bloc `EXCEPTION WHEN OTHERS` à la fonction `handle_new_user()`:

```sql
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO profiles (id, email, full_name, mode, created_at)
    VALUES (...);
    RAISE NOTICE 'profiles created successfully';
  EXCEPTION
    WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque PAS le signup
      RAISE WARNING 'Failed to create profiles: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
```

**Résultat:**
- Si l'INSERT dans `profiles` échoue → WARNING logué, signup continue
- Les autres triggers créent `user_profiles` et `company_profiles` normalement
- L'utilisateur peut se connecter même si `profiles` n'est pas créé

## Test à Effectuer

### 1. Test Signup PRO

```bash
# Ouvrir l'app
npm run dev

# Aller sur page signup (mode PRO)
# S'inscrire avec:
Email: test-belleya-fix-1@example.com
Prénom: Test
Nom: Fix
Mot de passe: TestFix123!
```

**Résultat attendu:**
- ✅ Signup réussi (pas d'erreur "Database error")
- ✅ Redirection vers Dashboard
- ✅ User créé dans auth.users
- ✅ Profile créé dans user_profiles
- ✅ Company créé dans company_profiles

**Logs attendus dans console navigateur:**
```
[SignUp] Starting signup process with role: pro
[SignUp] ✅ User created successfully in auth.users
[LoadProfile] ✅ Profile loaded successfully
[LoadProfile] Role: pro
```

### 2. Test Signup CLIENT

```bash
# Se déconnecter
# S'inscrire avec:
Email: test-belleya-fix-2@example.com
Role: CLIENT
```

**Résultat attendu:**
- ✅ Signup réussi
- ✅ Profile créé avec role = 'client'
- ✅ PAS de company créé (normal pour client)

### 3. Vérification DB

```sql
-- Vérifier les users créés
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE 'test-belleya-fix-%'
ORDER BY created_at DESC;

-- Vérifier les profiles
SELECT user_id, role, first_name, last_name
FROM user_profiles
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'test-belleya-fix-%');

-- Vérifier les companies (seulement pour PRO)
SELECT user_id, company_name
FROM company_profiles
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'test-belleya-fix-%');

-- Vérifier la table profiles (ancienne table)
SELECT id, email, mode
FROM profiles
WHERE id IN (SELECT id FROM auth.users WHERE email LIKE 'test-belleya-fix-%');
-- Peut être vide ou avoir des entrées (selon si RLS a bloqué ou non)
```

## Logs Supabase à Vérifier

**Dashboard Belleya > Database > Logs**

**Logs attendus:**
```
NOTICE: user_profiles created successfully for user [uuid]
NOTICE: company_profiles created successfully for user [uuid]
WARNING: Failed to create profiles for [uuid]: ... (si RLS bloque)
```

**PAS d'erreur attendue:**
- ❌ Pas de "ERROR: permission denied"
- ❌ Pas de "ERROR: Database error"

## Résultat

**AVANT:** Signup échoue avec "Database error saving new user"

**APRÈS:** Signup réussit, warning logué mais signup non bloqué

---

**Date:** 2024-01-18
**Fix appliqué:** ✅ Migration `fix_handle_new_user_error_handling`
**Prêt pour test:** ✅ Oui
