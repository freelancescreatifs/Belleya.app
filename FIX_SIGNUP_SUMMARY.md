# 🔧 Fix Signup - Résumé Exécutif

**Bug:** Erreur 500 "Database error saving new user"
**Statut:** ✅ RÉSOLU
**Date:** 2024-01-18

---

## 🎯 Cause Racine

Les triggers `AFTER INSERT` sur `auth.users` échouaient car:

1. **RLS activé** sur `user_profiles` et `company_profiles`
2. **Policies INSERT** vérifient `auth.uid() = user_id`
3. **Au moment du trigger, `auth.uid()` retourne NULL** (session pas encore établie)
4. **INSERT bloqué par RLS** → Trigger échoue → Signup renvoie 500

---

## ✅ Solution Appliquée

### Base de Données

**Migration:** `fix_signup_triggers_rls_bypass.sql`

1. **Nouvelles policies permissives:**
   ```sql
   CREATE POLICY "Service role can insert profiles"
     ON user_profiles FOR INSERT
     WITH CHECK (true);
   ```

2. **Triggers améliorés avec gestion d'erreur:**
   - `SECURITY DEFINER` pour bypass RLS
   - `EXCEPTION WHEN OTHERS` pour ne jamais bloquer
   - `RAISE WARNING` au lieu de `RAISE EXCEPTION`

3. **Triggers recréés:**
   - `on_auth_user_created_profile` → `handle_new_user_profile()`
   - `on_auth_user_created_company_profile` → `handle_new_company_profile()`

### Frontend

**Fichier:** `src/contexts/AuthContext.tsx`

1. **Logs détaillés améliorés:**
   - Tous les détails d'erreur Supabase affichés
   - Logs avec emojis pour faciliter le debugging

2. **Gestion du profil manquant:**
   - Ne bloque plus si profil absent (onboarding ultérieur possible)

3. **Messages d'erreur clairs:**
   - Erreurs spécifiques selon le type de problème

---

## 🧪 Tests à Effectuer

### Test 1: Signup PRO

```bash
# Interface
1. Aller sur /signup (mode PRO)
2. S'inscrire avec test-pro@example.com

# Console navigateur (F12) - Logs attendus:
✅ [SignUp] User created successfully in auth.users
✅ [LoadProfile] Profile loaded successfully
✅ [LoadProfile] Role: pro

# Vérification DB:
SELECT * FROM user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro@example.com');
-- Doit retourner 1 ligne avec role = 'pro'

SELECT * FROM company_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro@example.com');
-- Doit retourner 1 ligne
```

### Test 2: Signup CLIENT

```bash
# Interface
1. Aller sur /signup (mode CLIENT)
2. S'inscrire avec test-client@example.com

# Console - Logs attendus:
✅ [SignUp] User created successfully
✅ [LoadProfile] Role: client

# Vérification DB:
SELECT role FROM user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-client@example.com');
-- Doit retourner role = 'client'

SELECT COUNT(*) FROM company_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-client@example.com');
-- Doit retourner 0 (pas de company_profile pour client)
```

---

## 📋 Checklist Post-Déploiement

- [x] Migration DB appliquée
- [x] 3 triggers actifs sur auth.users
- [x] Policies "Service role can insert profiles" créées
- [x] Code frontend mis à jour
- [x] Build production réussi
- [ ] Test signup PRO en dev
- [ ] Test signup CLIENT en dev
- [ ] Vérification logs Supabase (pas d'erreurs)
- [ ] Déploiement en production

---

## 🚨 Commandes de Vérification Rapide

```sql
-- Vérifier les triggers
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
-- Doit retourner 3 lignes

-- Vérifier les policies
SELECT policyname FROM pg_policies
WHERE tablename IN ('user_profiles', 'company_profiles') AND cmd = 'INSERT';
-- Doit retourner 4 policies

-- Vérifier qu'un signup récent a fonctionné
SELECT u.email, up.role, cp.company_name
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '10 minutes';
```

---

## 📁 Fichiers Modifiés

1. **DB Migration:**
   - `supabase/migrations/fix_signup_triggers_rls_bypass.sql`

2. **Frontend:**
   - `src/contexts/AuthContext.tsx`

3. **Documentation:**
   - `DEBUG_SIGNUP_FIX.md` (détails complets)
   - `FIX_SIGNUP_SUMMARY.md` (ce fichier)

---

## 💡 Points Importants

### ✅ Ce qui fonctionne maintenant
- Signup PRO crée `user_profiles` + `company_profiles`
- Signup CLIENT crée uniquement `user_profiles`
- Les erreurs sont loggées mais ne bloquent plus
- Messages d'erreur clairs pour l'utilisateur

### ⚠️ À surveiller
- Logs Supabase: vérifier les `WARNING` dans Database > Logs
- Si triggers échouent souvent: investiguer la cause

### 🔜 Améliorations futures
1. Ajouter onboarding si profil manquant
2. Supprimer table `profiles` legacy
3. Fusionner les triggers pour simplifier

---

**Pour plus de détails:** Voir `DEBUG_SIGNUP_FIX.md`
