# 🧪 Guide de Test: Signup après Fix

## Objectif

Valider que le signup fonctionne correctement après le fix RLS.

---

## Prérequis

- Application démarrée: `npm run dev`
- Console navigateur ouverte (F12)
- Accès à Supabase Dashboard > Database

---

## Test 1: Signup Utilisateur PRO

### Étapes

1. **Ouvrir l'application**
   ```
   http://localhost:5173
   ```

2. **Aller sur la page d'inscription PRO**

3. **Remplir le formulaire**
   - Email: `test-pro-{timestamp}@example.com`
   - Prénom: `Test`
   - Nom: `Pro`
   - Mot de passe: `TestPro123!`

4. **Soumettre le formulaire**

### Résultats Attendus

#### Console Navigateur

Vous devez voir ces logs (dans l'ordre):

```
[Supabase] Connected to: https://xxxxx.supabase.co
[Supabase] Project: Belleya

[SignUp] Starting signup process with role: pro
[SignUp] Email: test-pro-xxx@example.com
[SignUp] First name: Test
[SignUp] Last name: Pro

[SignUp] ✅ User created successfully in auth.users
[SignUp] User ID: <uuid>
[SignUp] User email: test-pro-xxx@example.com

[SignUp] Waiting for database triggers to complete (2000ms)...
[SignUp] Loading user profile from user_profiles table...

[LoadProfile] 🔍 Loading profile for user: <uuid>
[LoadProfile] ✅ Profile loaded successfully
[LoadProfile] Role: pro
[LoadProfile] Name: Test Pro
[LoadProfile] Company ID: <uuid>

[SignUp] ✅ Profile loaded successfully: pro
```

#### Interface Utilisateur

- ✅ Pas d'erreur affichée
- ✅ Redirection vers le Dashboard
- ✅ Nom de l'utilisateur affiché dans le header

#### Base de Données

Exécuter ces requêtes dans SQL Editor de Supabase:

```sql
-- 1. Vérifier que le user existe dans auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test-pro-xxx@example.com';
-- Doit retourner 1 ligne

-- 2. Vérifier user_profiles
SELECT user_id, role, first_name, last_name, company_id
FROM user_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro-xxx@example.com');
-- Doit retourner:
-- role = 'pro'
-- first_name = 'Test'
-- last_name = 'Pro'
-- company_id = <uuid> (not null)

-- 3. Vérifier company_profiles
SELECT user_id, company_name, activity_type, legal_status
FROM company_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro-xxx@example.com');
-- Doit retourner:
-- company_name contient 'Test' ou 'Pro'
-- activity_type = 'onglerie'
-- legal_status = 'micro_entreprise'
```

---

## Test 2: Signup Utilisateur CLIENT

### Étapes

1. **Se déconnecter** (si connecté)

2. **Aller sur la page d'inscription CLIENT**

3. **Remplir le formulaire**
   - Email: `test-client-{timestamp}@example.com`
   - Prénom: `Test`
   - Nom: `Client`
   - Mot de passe: `TestClient123!`

4. **Soumettre le formulaire**

### Résultats Attendus

#### Console Navigateur

```
[SignUp] Starting signup process with role: client
[SignUp] ✅ User created successfully in auth.users
[LoadProfile] ✅ Profile loaded successfully
[LoadProfile] Role: client
```

#### Base de Données

```sql
-- 1. Vérifier user_profiles
SELECT user_id, role
FROM user_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-client-xxx@example.com');
-- Doit retourner role = 'client'

-- 2. Vérifier qu'il N'Y A PAS de company_profiles
SELECT COUNT(*)
FROM company_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-client-xxx@example.com');
-- Doit retourner 0
```

---

## Test 3: Vérifier les Logs Supabase

### Étapes

1. **Aller sur Supabase Dashboard**

2. **Database > Logs**

3. **Chercher les logs récents** (dernières 5 minutes)

### Résultats Attendus

Vous devez voir des logs de type `NOTICE`:

```
NOTICE: user_profiles created successfully for user <uuid>
NOTICE: company_profiles created successfully for user <uuid>
```

**OU** si un trigger échoue (cas edge):

```
WARNING: Failed to create company_profiles for <uuid>: <raison>
```

**IMPORTANT:** Les `WARNING` sont OK (ils n'empêchent pas le signup).
Ce qui compte c'est qu'il n'y ait **PAS d'erreur 500**.

---

## Test 4: Test d'Erreur (Email déjà utilisé)

### Étapes

1. **Essayer de s'inscrire avec un email déjà utilisé**
   - Email: celui du Test 1 ou 2
   - Mot de passe: n'importe quoi

2. **Soumettre le formulaire**

### Résultats Attendus

#### Console Navigateur

```
[SignUp] ❌ SIGNUP FAILED - Supabase auth.signUp error:
[SignUp] Error message: User already registered
```

#### Interface Utilisateur

- ❌ Message d'erreur affiché: "User already registered"
- ❌ Pas de redirection (reste sur la page signup)

---

## Test 5: Vérifier la Structure Complète

### Requête SQL Complète

```sql
-- Vue d'ensemble de tous les users récents avec leurs profils
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  up.role,
  up.first_name,
  up.last_name,
  up.company_id,
  cp.company_name,
  cp.legal_status
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;
```

### Résultats Attendus

Pour chaque user PRO:
- ✅ `user_id` présent
- ✅ `role` = 'pro'
- ✅ `first_name` et `last_name` remplis
- ✅ `company_id` NOT NULL
- ✅ `company_name` rempli
- ✅ `legal_status` = 'micro_entreprise'

Pour chaque user CLIENT:
- ✅ `user_id` présent
- ✅ `role` = 'client'
- ✅ `first_name` et `last_name` remplis
- ❌ `company_id` = NULL
- ❌ `company_name` = NULL
- ❌ `legal_status` = NULL

---

## Checklist de Validation

### Signup PRO
- [ ] User créé dans `auth.users`
- [ ] Profil créé dans `user_profiles` avec `role = 'pro'`
- [ ] Company créé dans `company_profiles`
- [ ] `company_id` dans `user_profiles` est rempli
- [ ] Pas d'erreur 500
- [ ] Logs OK dans console navigateur
- [ ] Redirection vers Dashboard

### Signup CLIENT
- [ ] User créé dans `auth.users`
- [ ] Profil créé dans `user_profiles` avec `role = 'client'`
- [ ] PAS de company dans `company_profiles`
- [ ] `company_id` dans `user_profiles` est NULL
- [ ] Pas d'erreur 500
- [ ] Logs OK dans console navigateur
- [ ] Redirection vers Dashboard

### Logs & Monitoring
- [ ] Logs `NOTICE` dans Supabase Dashboard
- [ ] Pas d'erreur dans les logs Supabase
- [ ] Logs détaillés dans console navigateur
- [ ] Messages d'erreur clairs si problème

---

## En cas d'échec

### Si erreur 500 persiste

1. **Vérifier les triggers:**
   ```sql
   SELECT trigger_name, action_statement
   FROM information_schema.triggers
   WHERE event_object_schema = 'auth'
     AND event_object_table = 'users';
   ```
   Doit retourner 3 triggers.

2. **Vérifier les policies:**
   ```sql
   SELECT policyname, tablename
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('user_profiles', 'company_profiles')
     AND cmd = 'INSERT';
   ```
   Doit retourner 4 policies (dont "Service role can insert profiles").

3. **Consulter les logs Supabase:**
   - Database > Logs
   - Chercher les erreurs PostgreSQL

### Si profil non créé

1. **Vérifier dans les logs Supabase:**
   - Y a-t-il un `WARNING` ?
   - Quelle est la raison ?

2. **Vérifier manuellement:**
   ```sql
   SELECT * FROM user_profiles WHERE user_id = '<uuid>';
   ```

3. **Recréer manuellement (si nécessaire):**
   ```sql
   INSERT INTO user_profiles (user_id, role, first_name, last_name)
   VALUES ('<uuid>', 'pro', 'Test', 'Manual');
   ```

---

## Résultat Final

Si tous les tests passent:

✅ **SIGNUP FONCTIONNEL** - Prêt pour production

Si un test échoue:

❌ **SIGNUP PROBLÉMATIQUE** - Consulter `DEBUG_SIGNUP_FIX.md`

---

**Durée estimée:** 10-15 minutes
**Prérequis:** Dev env fonctionnel + accès DB
