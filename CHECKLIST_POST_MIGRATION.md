# ✅ Checklist Post-Migration Belleya

**Date:** 2024-01-18
**Objectif:** Valider que la séparation ClientPulse ↔ Belleya est complète et fonctionnelle

---

## 📋 Instructions

Cette checklist doit être complétée APRÈS avoir suivi le guide de migration `SEPARATION_CLIENTPULSE_BELLEYA.md`.

Cocher chaque item au fur et à mesure. Si un item échoue, consulter la section Troubleshooting du guide de migration.

---

## 1️⃣ Configuration Supabase

### Organisation et Projet

- [ ] Organisation "Belleya" créée sur Supabase
- [ ] Projet "belleya-prod" (ou belleya-dev) créé dans l'organisation Belleya
- [ ] Région sélectionnée: `eu-central-1` (Europe) ou équivalent
- [ ] Database Password sauvegardé en lieu sûr (1Password, LastPass, etc.)

### Credentials Récupérés

- [ ] Project URL récupérée: `https://[belleya-ref].supabase.co`
- [ ] Anon Key récupérée: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Service Role Key récupérée et sauvegardée en lieu SÛR (ne jamais l'exposer côté client)

### Vérification Dashboard

- [ ] Dashboard Belleya accessible: https://supabase.com/dashboard/project/[belleya-ref]
- [ ] Aucune erreur affichée dans le dashboard
- [ ] Organisation "ClientPulse" toujours présente et inchangée

---

## 2️⃣ Migration Database (Structure Only)

### Tables

- [ ] Toutes les tables créées (vérifier dans Dashboard > Database > Tables)
  - [ ] `user_profiles`
  - [ ] `company_profiles`
  - [ ] `clients`
  - [ ] `revenues`
  - [ ] `expenses`
  - [ ] `agenda_events`
  - [ ] `tasks`
  - [ ] `goals`
  - [ ] `services`
  - [ ] `stock_items`
  - [ ] `students`
  - [ ] `content_calendar`
  - [ ] `projects`
  - [ ] ... (toutes les autres tables)

- [ ] Vérification SQL:
  ```sql
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
  -- Doit retourner: 30+ tables
  ```

### RLS (Row Level Security)

- [ ] RLS activé sur toutes les tables
- [ ] Vérification SQL:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  -- Toutes les tables doivent avoir rowsecurity = true
  ```

### Policies RLS

- [ ] Au moins 2 policies par table (SELECT + INSERT minimum)
- [ ] Vérification SQL:
  ```sql
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
  -- Doit retourner: 50+ policies
  ```

- [ ] Policies "Service role can insert profiles" créées:
  ```sql
  SELECT policyname FROM pg_policies
  WHERE tablename IN ('user_profiles', 'company_profiles')
    AND policyname LIKE '%Service role%';
  -- Doit retourner 2 lignes
  ```

### Triggers

- [ ] Triggers sur `auth.users` créés
- [ ] Vérification SQL:
  ```sql
  SELECT trigger_name, action_statement
  FROM information_schema.triggers
  WHERE event_object_schema = 'auth'
    AND event_object_table = 'users';
  -- Doit retourner au moins 3 triggers:
  -- - on_auth_user_created
  -- - on_auth_user_created_profile
  -- - on_auth_user_created_company_profile
  ```

### Functions

- [ ] Toutes les fonctions créées
- [ ] Vérification SQL:
  ```sql
  SELECT proname FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  ORDER BY proname;
  -- Doit inclure:
  -- - handle_new_user
  -- - handle_new_user_profile
  -- - handle_new_company_profile
  ```

- [ ] Fonctions utilisent `SECURITY DEFINER`
- [ ] Fonctions ont gestion d'erreur `EXCEPTION WHEN OTHERS`

### Vérification Aucune Donnée Migrée

- [ ] `auth.users` est VIDE (ou contient uniquement des users de test)
  ```sql
  SELECT COUNT(*) FROM auth.users;
  -- Doit retourner: 0
  ```

- [ ] Aucun ancien user ClientPulse présent
  ```sql
  SELECT email FROM auth.users;
  -- Ne doit retourner QUE des users de test Belleya (si tests déjà effectués)
  ```

---

## 3️⃣ Storage Configuration

### Buckets Créés

- [ ] Bucket `service-photos` créé
- [ ] Bucket `client-photos` créé
- [ ] Bucket `student-photos` créé
- [ ] Bucket `formation-documents` créé
- [ ] Bucket `user-documents` créé
- [ ] Bucket `content-media` créé
- [ ] Bucket `project-images` créé

- [ ] Vérification SQL:
  ```sql
  SELECT id, name, public FROM storage.buckets ORDER BY name;
  -- Doit retourner 7 buckets
  ```

### Policies Storage

- [ ] Chaque bucket a 4 policies (upload, read, update, delete)
- [ ] Vérification SQL:
  ```sql
  SELECT bucket_id, COUNT(*) as policy_count
  FROM storage.policies
  GROUP BY bucket_id
  ORDER BY bucket_id;
  -- Chaque bucket doit avoir 4 policies
  ```

- [ ] Policies testées (upload/download d'un fichier test)

---

## 4️⃣ Frontend Configuration

### Fichier .env

- [ ] `.env` existe à la racine du projet
- [ ] `VITE_SUPABASE_URL` pointe vers Belleya: `https://[belleya-ref].supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` contient la clé Belleya
- [ ] `VITE_PROJECT_NAME=Belleya` (optionnel mais recommandé)
- [ ] `VITE_ENV=development` ou `production` selon l'environnement

- [ ] Exemple de `.env` correct:
  ```bash
  VITE_SUPABASE_URL=https://lldznuayrxzvliehywoc.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_PROJECT_NAME=Belleya
  VITE_ENV=development
  ```

### Code Source

- [ ] `src/lib/supabase.ts` utilise `import.meta.env.VITE_SUPABASE_URL`
- [ ] `src/lib/supabase.ts` utilise `import.meta.env.VITE_SUPABASE_ANON_KEY`
- [ ] Aucune URL Supabase hardcodée dans `src/`
  ```bash
  grep -r "https://.*\.supabase\.co" src/
  # Doit retourner: AUCUN résultat
  ```

- [ ] Aucune clé API hardcodée dans `src/`
  ```bash
  grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/
  # Doit retourner: AUCUN résultat
  ```

- [ ] Aucune mention de "ClientPulse" dans `src/`
  ```bash
  grep -ri "clientpulse" src/
  # Doit retourner: AUCUN résultat
  ```

### .gitignore

- [ ] `.gitignore` existe
- [ ] `.env` est dans `.gitignore`
- [ ] `.env.local` est dans `.gitignore`
- [ ] `.env.production` est dans `.gitignore`
- [ ] Credentials non commités dans Git

### Dependencies

- [ ] `npm install` exécuté sans erreur
- [ ] `@supabase/supabase-js` installé (version 2.x)
- [ ] `node_modules/@supabase/supabase-js` présent

---

## 5️⃣ Build et Démarrage

### Dev Build

- [ ] `npm run dev` démarre sans erreur
- [ ] Application accessible sur `http://localhost:5173` (ou autre port)
- [ ] Console navigateur (F12) affiche:
  ```
  ╔═══════════════════════════════════════════════════════════════╗
  ║ 🚀 Supabase Project: Belleya                                  ║
  ║ 🌐 URL: https://[belleya-ref].supabase.co                    ║
  ║ 🛠️  Environment: development                                  ║
  ╚═══════════════════════════════════════════════════════════════╝
  ```

- [ ] AUCUNE erreur dans la console navigateur
- [ ] AUCUNE mention de "ClientPulse" dans la console

### Production Build

- [ ] `npm run build` compile sans erreur
- [ ] `dist/` directory créé
- [ ] Taille du bundle raisonnable (< 2 MB pour le JS principal)

---

## 6️⃣ Tests Fonctionnels

### Test 1: Signup Utilisateur PRO

- [ ] Page signup accessible
- [ ] Formulaire signup fonctionne (pas d'erreur)
- [ ] Inscription avec:
  - Email: `test-belleya-pro@example.com`
  - Prénom: `Test`
  - Nom: `Belleya`
  - Mot de passe: `TestBelleya123!`
  - Role: PRO

- [ ] Logs console attendus:
  ```
  [SignUp] Starting signup process with role: pro
  [SignUp] ✅ User created successfully in auth.users
  [LoadProfile] ✅ Profile loaded successfully
  [LoadProfile] Role: pro
  ```

- [ ] Aucune erreur 500
- [ ] Redirection vers Dashboard réussie
- [ ] Nom de l'utilisateur affiché dans le header

#### Vérification DB (Test 1)

- [ ] User créé dans `auth.users`:
  ```sql
  SELECT id, email FROM auth.users
  WHERE email = 'test-belleya-pro@example.com';
  -- Doit retourner 1 ligne
  ```

- [ ] Profile créé dans `user_profiles`:
  ```sql
  SELECT user_id, role, first_name, last_name, company_id
  FROM user_profiles
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-pro@example.com');
  -- Doit retourner: role = 'pro', company_id NOT NULL
  ```

- [ ] Company créé dans `company_profiles`:
  ```sql
  SELECT user_id, company_name, legal_status
  FROM company_profiles
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-pro@example.com');
  -- Doit retourner 1 ligne
  ```

### Test 2: Signup Utilisateur CLIENT

- [ ] Se déconnecter
- [ ] S'inscrire avec:
  - Email: `test-belleya-client@example.com`
  - Role: CLIENT

- [ ] Signup réussi sans erreur
- [ ] Redirection vers Dashboard

#### Vérification DB (Test 2)

- [ ] Profile créé avec `role = 'client'`:
  ```sql
  SELECT role FROM user_profiles
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-client@example.com');
  -- Doit retourner: role = 'client'
  ```

- [ ] AUCUN company créé:
  ```sql
  SELECT COUNT(*) FROM company_profiles
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-client@example.com');
  -- Doit retourner: 0
  ```

### Test 3: Login

- [ ] Se déconnecter
- [ ] Se reconnecter avec user PRO créé au Test 1
- [ ] Login réussi
- [ ] Redirection vers Dashboard
- [ ] Profil chargé correctement

### Test 4: Upload Fichier (Storage)

- [ ] Se connecter en PRO
- [ ] Aller dans Services > Créer un service
- [ ] Uploader une photo de service
- [ ] Upload réussi (pas d'erreur CORS ou 403)
- [ ] Photo visible dans l'application

#### Vérification Storage (Test 4)

- [ ] Fichier présent dans Storage > service-photos (Dashboard Supabase)
- [ ] Vérification SQL:
  ```sql
  SELECT id, bucket_id, name, owner
  FROM storage.objects
  WHERE bucket_id = 'service-photos'
    AND owner = (SELECT id FROM auth.users WHERE email = 'test-belleya-pro@example.com');
  -- Doit retourner 1 ligne
  ```

### Test 5: CRUD Client

- [ ] Se connecter en PRO
- [ ] Aller dans Clients > Ajouter un client
- [ ] Créer un client test:
  - Prénom: `Marie`
  - Nom: `Dupont`
  - Email: `marie@example.com`
  - Téléphone: `0601020304`

- [ ] Client créé sans erreur
- [ ] Client visible dans la liste

#### Vérification DB (Test 5)

- [ ] Client créé:
  ```sql
  SELECT first_name, last_name, email, company_id
  FROM clients
  WHERE email = 'marie@example.com';
  -- Doit retourner 1 ligne
  ```

### Test 6: CRUD Agenda

- [ ] Aller dans Agenda
- [ ] Créer un rendez-vous:
  - Client: Marie Dupont
  - Date: Demain
  - Heure: 14h00
  - Durée: 1h30

- [ ] Rendez-vous créé sans erreur
- [ ] Rendez-vous visible dans le calendrier

#### Vérification DB (Test 6)

- [ ] Événement créé:
  ```sql
  SELECT title, event_type, start_time, client_id
  FROM agenda_events
  WHERE client_id = (SELECT id FROM clients WHERE email = 'marie@example.com');
  -- Doit retourner 1 ligne
  ```

### Test 7: CRUD Revenue

- [ ] Aller dans Finances > Revenus
- [ ] Créer un revenu test
- [ ] Revenu créé sans erreur
- [ ] Revenu visible dans la liste

### Test 8: CRUD Expense

- [ ] Aller dans Finances > Dépenses
- [ ] Créer une dépense test
- [ ] Dépense créée sans erreur
- [ ] Dépense visible dans la liste

---

## 7️⃣ Vérification Logs Supabase

### Logs Database

- [ ] Aller dans Dashboard Belleya > Database > Logs
- [ ] Filtrer par "Last 1 hour"
- [ ] Chercher les logs de type `NOTICE`:
  - `NOTICE: user_profiles created successfully for user [uuid]`
  - `NOTICE: company_profiles created successfully for user [uuid]`

- [ ] Vérifier qu'il n'y a PAS d'erreur:
  - Pas de `ERROR: permission denied`
  - Pas de `ERROR: duplicate key value`
  - Pas de `ERROR: violates foreign key constraint`

- [ ] Si des `WARNING` existent, vérifier qu'ils ne bloquent pas le signup

### Logs Edge Functions (si applicable)

- [ ] Aller dans Dashboard Belleya > Edge Functions > Logs
- [ ] Vérifier qu'il n'y a pas d'erreurs

---

## 8️⃣ Validation Séparation Complète

### Script de Validation

- [ ] Exécuter le script de validation:
  ```bash
  ./validate_separation.sh
  ```

- [ ] Tous les checks doivent passer (✓)
- [ ] Aucun check ne doit échouer (✗)
- [ ] Warnings (⚠) acceptables si documentés

### Vérification Manuelle

- [ ] Aller sur Dashboard ClientPulse
- [ ] Vérifier que ClientPulse est INCHANGÉ
- [ ] Aucun user Belleya dans ClientPulse:
  ```sql
  -- Dans projet ClientPulse
  SELECT email FROM auth.users WHERE email LIKE '%belleya%';
  -- Doit retourner: 0 lignes
  ```

- [ ] Aller sur Dashboard Belleya
- [ ] Vérifier qu'aucun user ClientPulse n'est dans Belleya:
  ```sql
  -- Dans projet Belleya
  SELECT COUNT(*) FROM auth.users;
  -- Doit retourner: 2-3 (uniquement les users de test)
  ```

### Vérification Git

- [ ] `.env` n'est PAS commité dans Git:
  ```bash
  git status
  # .env ne doit PAS apparaître dans les fichiers trackés
  ```

- [ ] Aucune clé API commitée:
  ```bash
  git log -p | grep "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  # Doit retourner: AUCUN résultat
  ```

---

## 9️⃣ Documentation

### Fichiers de Doc Créés

- [ ] `SEPARATION_CLIENTPULSE_BELLEYA.md` créé (guide complet)
- [ ] `CHECKLIST_POST_MIGRATION.md` créé (cette checklist)
- [ ] `validate_separation.sh` créé (script de validation)
- [ ] `.env.belleya.example` créé (template .env)

### README Mis à Jour

- [ ] README mentionne la séparation Belleya/ClientPulse
- [ ] README contient les instructions de setup .env
- [ ] README contient les commandes de démarrage

---

## 🔟 Production (Optionnel)

Si vous déployez en production immédiatement:

### Environnement Production

- [ ] Créer un projet Supabase "belleya-prod" (pas Free tier)
- [ ] Appliquer toutes les migrations sur belleya-prod
- [ ] Configurer les buckets Storage sur belleya-prod
- [ ] Créer `.env.production` avec credentials prod

### Déploiement

- [ ] Configurer CI/CD (GitHub Actions, Vercel, Netlify, etc.)
- [ ] Build production testé
- [ ] Déploiement réussi
- [ ] Site accessible sur domaine custom (belleya.app)

### Monitoring

- [ ] Configurer alertes Supabase (Database > Settings > Alerts)
- [ ] Monitorer erreurs signup (vérifier logs régulièrement)
- [ ] Monitorer usage Storage
- [ ] Configurer Sentry ou équivalent pour erreurs frontend

---

## ✅ Validation Finale

### Résumé

Si TOUS les items ci-dessus sont cochés:

- ✅ **Séparation complète validée**
- ✅ **Belleya fonctionnel sur son propre projet Supabase**
- ✅ **ClientPulse inchangé**
- ✅ **Aucune donnée partagée**
- ✅ **Prêt pour production**

### Prochaines Étapes

1. Nettoyer les users de test (optionnel):
   ```sql
   DELETE FROM auth.users WHERE email LIKE 'test-%';
   ```

2. Documenter les credentials en lieu sûr (1Password, LastPass)

3. Former l'équipe sur la nouvelle architecture

4. Planifier la migration des données si nécessaire (séparément)

5. Monitorer pendant 48h pour détecter tout problème

---

## 🚨 En Cas de Problème

Si un item échoue, consulter:

1. **Guide de migration:** `SEPARATION_CLIENTPULSE_BELLEYA.md` (section Troubleshooting)
2. **Fix signup:** `DEBUG_SIGNUP_FIX.md`
3. **Logs Supabase:** Dashboard > Database > Logs
4. **Script validation:** `./validate_separation.sh`

---

**Date:** 2024-01-18
**Version:** 1.0
**Statut:** ✅ Checklist complète - Prête à utiliser
