# Guide Complet : Séparation ClientPulse ↔ Belleya

**Date:** 2024-01-18
**Version:** 1.0
**Objectif:** Séparer totalement ClientPulse et Belleya en deux organisations Supabase distinctes

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture cible](#architecture-cible)
3. [Prérequis](#prérequis)
4. [Étape 1: Créer l'organisation Belleya](#étape-1-créer-lorganisation-belleya)
5. [Étape 2: Créer le projet Supabase Belleya](#étape-2-créer-le-projet-supabase-belleya)
6. [Étape 3: Migrer la STRUCTURE ONLY](#étape-3-migrer-la-structure-only)
7. [Étape 4: Configurer Storage](#étape-4-configurer-storage)
8. [Étape 5: Mettre à jour le frontend](#étape-5-mettre-à-jour-le-frontend)
9. [Étape 6: Tests post-migration](#étape-6-tests-post-migration)
10. [Étape 7: Validation finale](#étape-7-validation-finale)

---

## 🎯 Vue d'ensemble

### Situation Actuelle

- **Un seul projet Supabase** partagé entre ClientPulse et Belleya
- Risques de confusion, conflits de policies, mélange de données
- Facturation et équipes non séparées

### Situation Cible

```
┌─────────────────────────────────────────────────────────────┐
│                    SÉPARATION COMPLÈTE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Organisation ClientPulse          Organisation Belleya    │
│  ├─ Projet Supabase ClientPulse    ├─ Projet Supabase     │
│  ├─ auth.users ClientPulse          │   Belleya            │
│  ├─ DB Schema ClientPulse           ├─ auth.users Belleya  │
│  └─ Storage ClientPulse             ├─ DB Schema Belleya   │
│                                     └─ Storage Belleya      │
│  Site: clientpulse.app              Site: belleya.app      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Principes de la Séparation

1. **ISOLATION TOTALE**
   - Aucune donnée partagée (ni users, ni DB, ni storage)
   - Clés API complètement différentes
   - Dashboards séparés
   - Logs séparés

2. **MIGRATION STRUCTURE ONLY**
   - On migre uniquement: tables, policies RLS, triggers, functions, buckets
   - On NE migre PAS: auth.users, sessions, données utilisateurs

3. **NO TOUCH CLIENTPULSE**
   - ClientPulse reste 100% inchangé
   - Tous les changements sont côté Belleya uniquement

---

## 🏗️ Architecture Cible

### Organisation ClientPulse (INCHANGÉE)

```
Organisation: ClientPulse
└── Projet: clientpulse-prod
    ├── Database
    │   ├── auth.users (users ClientPulse)
    │   ├── Schema ClientPulse
    │   └── Functions/Triggers ClientPulse
    ├── Storage
    │   └── Buckets ClientPulse
    └── Auth
        └── Providers ClientPulse
```

### Organisation Belleya (NOUVELLE)

```
Organisation: Belleya
└── Projet: belleya-prod
    ├── Database
    │   ├── auth.users (VIDE au départ)
    │   ├── Schema Belleya (migré)
    │   └── Functions/Triggers Belleya (migrés)
    ├── Storage
    │   └── Buckets Belleya (recréés)
    └── Auth
        └── Providers Belleya (configurés)
```

---

## ✅ Prérequis

### Accès Requis

- [ ] Compte Supabase avec droits de création d'organisations
- [ ] Accès au projet ClientPulse actuel (pour export schema)
- [ ] Accès au repo Git Belleya
- [ ] Droits d'admin sur le projet

### Outils Nécessaires

- [ ] `psql` (PostgreSQL CLI) installé
- [ ] `supabase` CLI installé (optionnel mais recommandé)
- [ ] Node.js et npm installés
- [ ] Git configuré

### Informations à Préparer

- [ ] Nom de la nouvelle organisation: `Belleya`
- [ ] Nom du nouveau projet: `belleya-prod` (ou `belleya-dev` pour dev)
- [ ] Région Supabase: `eu-central-1` (recommandé pour Europe)
- [ ] Liste des buckets Storage à créer
- [ ] Liste des Edge Functions à déployer

---

## 📝 Étape 1: Créer l'Organisation Belleya

### 1.1 Connexion à Supabase

```bash
# Aller sur le dashboard Supabase
https://supabase.com/dashboard
```

### 1.2 Créer une Nouvelle Organisation

1. **Cliquer sur le menu organisations** (en haut à gauche)
2. **Cliquer sur "New organization"**
3. **Remplir les informations:**
   - Organization name: `Belleya`
   - Plan: `Free` (pour commencer, upgrader plus tard si besoin)
4. **Cliquer sur "Create organization"**

### 1.3 Vérification

- [ ] Organisation "Belleya" créée
- [ ] Vous êtes owner de cette organisation
- [ ] Dashboard affiche "Belleya" dans le sélecteur d'organisations

---

## 🚀 Étape 2: Créer le Projet Supabase Belleya

### 2.1 Créer le Projet

1. **Dans l'organisation Belleya, cliquer sur "New project"**
2. **Remplir les informations:**
   ```
   Project name: belleya-prod
   Database Password: [générer un mot de passe fort et le sauvegarder]
   Region: Europe (Frankfurt) - eu-central-1
   Pricing Plan: Free
   ```
3. **Cliquer sur "Create new project"**
4. **Attendre 2-3 minutes** (création de la DB + infrastructure)

### 2.2 Récupérer les Credentials

Une fois le projet créé:

1. **Aller dans Settings > API**
2. **Copier et sauvegarder:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6... (CONFIDENTIEL)
   ```

3. **Sauvegarder dans un fichier sécurisé** (ex: 1Password, LastPass)

### 2.3 Vérification

- [ ] Projet "belleya-prod" créé dans l'organisation Belleya
- [ ] Project URL récupérée
- [ ] anon key récupérée
- [ ] service_role key sauvegardée en lieu sûr

---

## 🔄 Étape 3: Migrer la STRUCTURE ONLY

### 3.1 Export du Schema depuis ClientPulse

**ATTENTION:** Nous exportons UNIQUEMENT la structure (tables, policies, triggers, functions).
**PAS les données utilisateurs** (auth.users, sessions, etc.)

#### Option A: Via SQL Editor Supabase

1. **Aller sur le projet ClientPulse**
2. **SQL Editor > New query**
3. **Exécuter ce script d'export:**

```sql
-- ============================================================================
-- EXPORT SCHEMA ONLY - ClientPulse → Belleya
-- ============================================================================
-- Ce script génère le SQL de création de toutes les tables, policies,
-- triggers et functions (SANS LES DONNÉES)
-- ============================================================================

-- 1. Export des tables (structure seulement)
SELECT
  'CREATE TABLE IF NOT EXISTS ' || schemaname || '.' || tablename || ' (' ||
  string_agg(
    column_name || ' ' || data_type ||
    CASE
      WHEN character_maximum_length IS NOT NULL
      THEN '(' || character_maximum_length || ')'
      ELSE ''
    END ||
    CASE
      WHEN column_default IS NOT NULL
      THEN ' DEFAULT ' || column_default
      ELSE ''
    END ||
    CASE
      WHEN is_nullable = 'NO'
      THEN ' NOT NULL'
      ELSE ''
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT IN ('profiles') -- Exclure les tables ClientPulse
GROUP BY schemaname, tablename;

-- 2. Export des contraintes
SELECT
  'ALTER TABLE ' || nspname || '.' || relname ||
  ' ADD CONSTRAINT ' || conname ||
  ' ' || pg_get_constraintdef(oid) || ';'
FROM pg_constraint
JOIN pg_class ON pg_class.oid = conrelid
JOIN pg_namespace ON pg_namespace.oid = relnamespace
WHERE nspname = 'public'
  AND contype IN ('p', 'u', 'f', 'c'); -- PRIMARY, UNIQUE, FOREIGN, CHECK

-- 3. Export des indexes
SELECT
  'CREATE INDEX IF NOT EXISTS ' || indexname ||
  ' ON ' || schemaname || '.' || tablename ||
  ' USING ' || indexdef || ';'
FROM pg_indexes
WHERE schemaname = 'public';

-- 4. Export des policies RLS
SELECT
  'CREATE POLICY "' || policyname || '"' ||
  ' ON ' || schemaname || '.' || tablename ||
  ' FOR ' || cmd ||
  ' TO ' || array_to_string(roles, ', ') ||
  CASE
    WHEN qual IS NOT NULL
    THEN ' USING (' || qual || ')'
    ELSE ''
  END ||
  CASE
    WHEN with_check IS NOT NULL
    THEN ' WITH CHECK (' || with_check || ')'
    ELSE ''
  END || ';'
FROM pg_policies
WHERE schemaname = 'public';

-- 5. Export des triggers
SELECT
  'CREATE TRIGGER ' || trigger_name ||
  ' ' || action_timing || ' ' || event_manipulation ||
  ' ON ' || event_object_schema || '.' || event_object_table ||
  ' FOR EACH ROW ' || action_statement || ';'
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 6. Export des fonctions
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
```

**PROBLÈME:** Cette approche est complexe et génère du SQL brut.

#### Option B: Utiliser les Migrations Existantes (RECOMMANDÉ)

**Le projet Belleya a déjà 68 migrations dans `supabase/migrations/`.**

Ces migrations contiennent TOUTE la structure nécessaire. Il suffit de les appliquer sur le nouveau projet Belleya.

### 3.2 Appliquer les Migrations sur Belleya

#### Méthode 1: Via SQL Editor (Manuel)

1. **Aller sur le projet Belleya > SQL Editor**
2. **Exécuter chaque migration dans l'ordre** (du plus ancien au plus récent)

```bash
# Liste des migrations à exécuter dans l'ordre:
supabase/migrations/20260114122011_create_nail_tech_schema.sql
supabase/migrations/20260114133227_add_advanced_features.sql
...
supabase/migrations/fix_signup_triggers_rls_bypass.sql (la plus récente)
```

3. **Pour chaque fichier:**
   - Ouvrir le fichier `.sql`
   - Copier tout le contenu
   - Coller dans SQL Editor de Belleya
   - Cliquer sur "Run"
   - Vérifier qu'il n'y a pas d'erreur

#### Méthode 2: Via Supabase CLI (Automatique)

```bash
# 1. Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Se connecter à Supabase
supabase login

# 3. Lier le projet Belleya
cd /path/to/belleya-project
supabase link --project-ref xxxxx  # xxxxx = project ref de Belleya

# 4. Appliquer toutes les migrations
supabase db push

# 5. Vérifier que tout est appliqué
supabase db diff
# Doit retourner: "No schema changes detected"
```

### 3.3 Vérification Post-Migration

```sql
-- 1. Vérifier que toutes les tables sont créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Doit retourner (au minimum):
-- - user_profiles
-- - company_profiles
-- - clients
-- - revenues
-- - expenses
-- - agenda_events
-- - tasks
-- - goals
-- - services
-- - stock_items
-- - students
-- - content_calendar
-- - projects
-- ... (et toutes les autres tables Belleya)

-- 2. Vérifier que RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Toutes les tables doivent avoir rowsecurity = true

-- 3. Vérifier les policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Doit retourner toutes les policies (au moins 50+)

-- 4. Vérifier les triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Doit retourner au moins:
-- - on_auth_user_created
-- - on_auth_user_created_profile
-- - on_auth_user_created_company_profile

-- 5. Vérifier les fonctions
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Doit retourner:
-- - handle_new_user
-- - handle_new_user_profile
-- - handle_new_company_profile
-- ... (toutes les autres fonctions)
```

### 3.4 Checklist Validation Structure

- [ ] Toutes les tables créées (vérifier avec `\dt` ou query ci-dessus)
- [ ] RLS activé sur toutes les tables
- [ ] Toutes les policies créées (au moins 2 par table)
- [ ] Tous les triggers créés (au moins 3 sur auth.users)
- [ ] Toutes les fonctions créées
- [ ] Aucune erreur dans les logs Supabase (Database > Logs)

---

## 🗄️ Étape 4: Configurer Storage

### 4.1 Créer les Buckets

**Liste des buckets à créer:**

1. **service-photos** (photos de prestations)
2. **client-photos** (photos de clients)
3. **student-photos** (photos d'élèves)
4. **formation-documents** (documents de formation)
5. **user-documents** (documents utilisateurs)
6. **content-media** (médias pour contenu social media)
7. **project-images** (images de projets)

**Pour chaque bucket:**

1. **Aller dans Storage > Create bucket**
2. **Remplir:**
   ```
   Bucket name: service-photos (ou autre nom)
   Public: false (sauf content-media qui peut être public)
   File size limit: 10 MB (ajuster selon besoin)
   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
   ```
3. **Cliquer sur "Create bucket"**

### 4.2 Créer les Policies Storage

**Pour chaque bucket, créer ces policies:**

```sql
-- Policy 1: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Authenticated users can read own files
CREATE POLICY "Authenticated users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Authenticated users can update own files
CREATE POLICY "Authenticated users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'service-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Authenticated users can delete own files
CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Répéter pour chaque bucket** (remplacer `service-photos` par le nom du bucket).

### 4.3 Vérification Storage

```sql
-- 1. Lister les buckets
SELECT id, name, public FROM storage.buckets;

-- Doit retourner tous les buckets créés

-- 2. Vérifier les policies
SELECT
  bucket_id,
  name,
  definition
FROM storage.policies
ORDER BY bucket_id, name;

-- Doit retourner 4 policies par bucket (upload, read, update, delete)
```

### 4.4 Checklist Storage

- [ ] 7 buckets créés (ou selon besoin)
- [ ] Chaque bucket a 4 policies (upload, read, update, delete)
- [ ] Policies testées (upload/download d'un fichier test)
- [ ] File size limits configurés
- [ ] MIME types autorisés configurés

---

## 💻 Étape 5: Mettre à jour le Frontend

### 5.1 Mettre à jour le fichier .env

**AVANT (ClientPulse - NE PLUS UTILISER):**

```bash
VITE_SUPABASE_URL=https://[old-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.old_key...
VITE_PROJECT_NAME=ClientPulse
```

**APRÈS (Belleya - NOUVEAU):**

```bash
# ============================================================================
# BELLEYA - CONFIGURATION SUPABASE
# ============================================================================

# Project URL (récupéré dans Settings > API du projet Belleya)
VITE_SUPABASE_URL=https://[belleya-project-ref].supabase.co

# Anon Key (récupéré dans Settings > API du projet Belleya)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.belleya_key...

# Project identifier
VITE_PROJECT_NAME=Belleya

# Environment
VITE_ENV=development
```

### 5.2 Scanner le Repo pour Traces ClientPulse

```bash
# 1. Chercher toutes les occurrences de "clientpulse"
grep -ri "clientpulse" . --exclude-dir=node_modules --exclude-dir=dist

# Doit retourner: UNIQUEMENT des fichiers de doc (.md)
# PAS de fichiers .ts, .tsx, .js, .env

# 2. Chercher toutes les URLs Supabase hardcodées
grep -r "supabase.co" src/ --exclude-dir=node_modules

# Doit retourner: AUCUN résultat
# Toutes les URLs doivent venir de import.meta.env

# 3. Vérifier qu'aucune clé hardcodée n'existe
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ --exclude-dir=node_modules

# Doit retourner: AUCUN résultat
# Les clés doivent UNIQUEMENT être dans .env
```

### 5.3 Vérifier le Code Source

**Fichiers à vérifier:**

1. **`src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

// ✅ BON: Variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ MAUVAIS: URL hardcodée
// const supabaseUrl = 'https://old-project.supabase.co';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

2. **Edge Functions (si existantes)**

Vérifier que les Edge Functions utilisent les variables d'environnement Supabase automatiques:

```typescript
// ✅ BON: Variables auto-injectées par Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ❌ MAUVAIS: Hardcodé
// const supabaseUrl = 'https://old-project.supabase.co';
```

### 5.4 Tester Localement

```bash
# 1. Nettoyer les caches
rm -rf node_modules/.vite
rm -rf dist

# 2. Installer les dépendances
npm install

# 3. Démarrer en dev
npm run dev

# 4. Ouvrir la console navigateur (F12)
# Vous devez voir:
# ╔═══════════════════════════════════════════════════════════════╗
# ║ 🚀 Supabase Project: Belleya                                  ║
# ║ 🌐 URL: https://[belleya-ref].supabase.co                    ║
# ║ 🛠️  Environment: development                                  ║
# ╚═══════════════════════════════════════════════════════════════╝

# Si vous voyez ClientPulse ou l'ancienne URL → STOP et corriger
```

### 5.5 Checklist Frontend

- [ ] `.env` mis à jour avec credentials Belleya
- [ ] `VITE_PROJECT_NAME=Belleya` dans .env
- [ ] Aucune URL ClientPulse dans src/
- [ ] Aucune clé hardcodée dans src/
- [ ] Console affiche "Belleya" au démarrage
- [ ] Console affiche la bonne URL Belleya

---

## 🧪 Étape 6: Tests Post-Migration

### 6.1 Test 1: Signup Utilisateur PRO

**Objectif:** Vérifier que le signup fonctionne end-to-end sur Belleya.

```bash
# 1. Ouvrir l'app en dev
npm run dev

# 2. Aller sur /signup (mode PRO)
# 3. S'inscrire avec:
Email: test-belleya-pro@example.com
Prénom: Test
Nom: Belleya
Mot de passe: TestBelleya123!

# 4. Logs attendus dans console:
[SignUp] Starting signup process with role: pro
[SignUp] ✅ User created successfully in auth.users
[LoadProfile] ✅ Profile loaded successfully
[LoadProfile] Role: pro
```

**Vérification DB Belleya:**

```sql
-- User doit être dans auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test-belleya-pro@example.com';

-- Profil doit être dans user_profiles
SELECT user_id, role, first_name, last_name, company_id
FROM user_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-pro@example.com');

-- Company doit être dans company_profiles
SELECT user_id, company_name, legal_status
FROM company_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-pro@example.com');
```

**Résultats Attendus:**

- ✅ User créé dans auth.users (projet Belleya)
- ✅ Profil créé dans user_profiles avec role = 'pro'
- ✅ Company créé dans company_profiles
- ✅ Pas d'erreur 500
- ✅ Redirection vers Dashboard

### 6.2 Test 2: Signup Utilisateur CLIENT

```bash
# 1. Se déconnecter
# 2. S'inscrire avec:
Email: test-belleya-client@example.com
Role: client

# Vérification DB:
SELECT role FROM user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-client@example.com');
-- Doit retourner: role = 'client'

SELECT COUNT(*) FROM company_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-belleya-client@example.com');
-- Doit retourner: 0 (pas de company pour client)
```

### 6.3 Test 3: Upload Fichier (Storage)

```bash
# 1. Se connecter avec le user PRO créé
# 2. Aller dans Services > Créer un service
# 3. Uploader une photo

# Vérification:
# - Upload réussi (pas d'erreur CORS ou 403)
# - Photo visible dans l'app
# - Photo présente dans Storage > service-photos
```

**Vérification DB:**

```sql
-- Vérifier que le fichier est dans storage.objects
SELECT
  id,
  bucket_id,
  name,
  owner
FROM storage.objects
WHERE bucket_id = 'service-photos'
  AND owner = (SELECT id FROM auth.users WHERE email = 'test-belleya-pro@example.com');

-- Doit retourner 1 ligne
```

### 6.4 Test 4: Création Client

```bash
# 1. Aller dans Clients > Ajouter un client
# 2. Créer un client test:
Prénom: Marie
Nom: Dupont
Email: marie@example.com
Téléphone: 0601020304

# Vérification:
# - Client créé sans erreur
# - Client visible dans la liste
```

**Vérification DB:**

```sql
SELECT
  first_name,
  last_name,
  email,
  company_id
FROM clients
WHERE email = 'marie@example.com';

-- Doit retourner 1 ligne avec company_id = celui du user PRO
```

### 6.5 Test 5: Création Rendez-vous (Agenda)

```bash
# 1. Aller dans Agenda
# 2. Créer un rendez-vous:
Client: Marie Dupont
Date: Aujourd'hui + 1 jour
Heure: 14h00
Durée: 1h30
Type: Prestation

# Vérification:
# - Rendez-vous créé sans erreur
# - Rendez-vous visible dans le calendrier
```

**Vérification DB:**

```sql
SELECT
  title,
  event_type,
  start_time,
  end_time,
  client_id
FROM agenda_events
WHERE client_id = (SELECT id FROM clients WHERE email = 'marie@example.com');

-- Doit retourner 1 ligne
```

### 6.6 Checklist Tests

- [ ] Signup PRO réussi (user + profile + company créés)
- [ ] Signup CLIENT réussi (user + profile créés, pas de company)
- [ ] Upload fichier réussi (Storage)
- [ ] Création client réussie
- [ ] Création rendez-vous réussie
- [ ] Création revenu réussie
- [ ] Création dépense réussie
- [ ] Création tâche réussie
- [ ] Aucune erreur dans console navigateur
- [ ] Aucune erreur dans logs Supabase (Database > Logs)

---

## ✅ Étape 7: Validation Finale

### 7.1 Validation Séparation Complète

```bash
# 1. Vérifier qu'aucun user Belleya n'est dans ClientPulse
# (Aller sur projet ClientPulse > Authentication > Users)
# → Chercher test-belleya-pro@example.com
# → Doit retourner: User not found

# 2. Vérifier qu'aucun user ClientPulse n'est dans Belleya
# (Aller sur projet Belleya > Authentication > Users)
# → Ne doit voir QUE les users créés dans les tests
# → Aucun ancien user ClientPulse

# 3. Vérifier les URLs dans le code
grep -r "supabase.co" src/
# Doit retourner: AUCUN résultat

# 4. Vérifier les clés dans le code
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/
# Doit retourner: AUCUN résultat
```

### 7.2 Validation Organisation Supabase

**Organisation ClientPulse:**

- [ ] Projet "clientpulse-prod" présent et inchangé
- [ ] Aucune modification effectuée
- [ ] Users ClientPulse toujours présents
- [ ] Données ClientPulse intactes

**Organisation Belleya:**

- [ ] Projet "belleya-prod" créé
- [ ] Toutes les tables présentes (68 migrations appliquées)
- [ ] Tous les triggers présents (3 sur auth.users)
- [ ] Toutes les policies présentes (50+)
- [ ] Tous les buckets Storage créés (7)
- [ ] Aucun user migré (auth.users vide ou uniquement users de test)

### 7.3 Validation Frontend

- [ ] `.env` pointe vers Belleya uniquement
- [ ] Console affiche "Belleya" au démarrage
- [ ] Aucune mention de ClientPulse dans src/
- [ ] Build production réussi (`npm run build`)
- [ ] Tests end-to-end réussis

### 7.4 Checklist Finale

**Séparation:**

- [ ] Deux organisations distinctes (ClientPulse + Belleya)
- [ ] Deux projets Supabase distincts
- [ ] Aucune donnée partagée (ni users, ni DB, ni storage)
- [ ] Clés API complètement différentes
- [ ] Dashboards séparés

**Sécurité:**

- [ ] Aucune clé hardcodée dans le code
- [ ] service_role key sauvegardée en lieu sûr
- [ ] RLS activé sur toutes les tables
- [ ] Policies restrictives sur toutes les tables
- [ ] Triggers ne bloquent jamais le signup

**Fonctionnel:**

- [ ] Signup fonctionne (PRO + CLIENT)
- [ ] Storage fonctionne (upload/download)
- [ ] CRUD fonctionne (clients, rendez-vous, revenues, etc.)
- [ ] Pas d'erreur dans les logs

**Documentation:**

- [ ] `.env.belleya.example` à jour
- [ ] README mis à jour
- [ ] Guide de migration documenté
- [ ] Équipe informée de la séparation

---

## 📊 Commandes de Vérification Rapide

### Vérifier la Structure DB

```sql
-- Tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Doit retourner: 30+ tables

-- Policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Doit retourner: 50+ policies

-- Triggers
SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
-- Doit retourner: 3+ triggers

-- Functions
SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
-- Doit retourner: 10+ functions

-- Buckets
SELECT COUNT(*) FROM storage.buckets;
-- Doit retourner: 7 buckets
```

### Vérifier les Users

```sql
-- Sur Belleya: Compter les users
SELECT COUNT(*) FROM auth.users;
-- Doit retourner: 0 (avant tests) ou 2-3 (après tests)

-- Lister les users créés
SELECT email, created_at FROM auth.users ORDER BY created_at DESC;
-- Ne doit voir QUE les users de test Belleya
```

### Vérifier Storage

```sql
-- Buckets
SELECT id, name, public FROM storage.buckets ORDER BY name;

-- Policies Storage
SELECT bucket_id, COUNT(*) as policy_count
FROM storage.policies
GROUP BY bucket_id
ORDER BY bucket_id;
-- Chaque bucket doit avoir 4 policies
```

---

## 🚨 Troubleshooting

### Problème 1: Erreur 500 au Signup

**Cause:** Triggers échouent (RLS bloque INSERT)

**Solution:**

```sql
-- Vérifier que les policies "Service role can insert profiles" existent
SELECT policyname FROM pg_policies
WHERE tablename IN ('user_profiles', 'company_profiles')
  AND policyname LIKE '%Service role%';

-- Si elles n'existent pas, exécuter:
-- (Voir migration fix_signup_triggers_rls_bypass.sql)
```

### Problème 2: Upload Fichier Échoue (403)

**Cause:** Policies Storage incorrectes ou manquantes

**Solution:**

```sql
-- Vérifier les policies
SELECT * FROM storage.policies WHERE bucket_id = 'service-photos';

-- Si aucune policy → créer les 4 policies (voir Étape 4.2)
```

### Problème 3: Frontend Affiche ClientPulse

**Cause:** `.env` pas mis à jour ou cache navigateur

**Solution:**

```bash
# 1. Vérifier .env
cat .env | grep VITE_PROJECT_NAME
# Doit afficher: VITE_PROJECT_NAME=Belleya

# 2. Nettoyer cache
rm -rf node_modules/.vite
rm -rf dist

# 3. Redémarrer
npm run dev

# 4. Vider cache navigateur (Ctrl+Shift+Delete)
```

### Problème 4: Users ClientPulse Présents dans Belleya

**Cause:** Migration users effectuée par erreur

**Solution:**

```sql
-- ⚠️ DANGER: Supprimer TOUS les users Belleya
-- À NE FAIRE QUE si sûr qu'aucun user légitime Belleya n'existe

-- 1. Sauvegarder d'abord (au cas où)
SELECT * FROM auth.users;

-- 2. Supprimer les users (CASCADE supprime aussi profiles + companies)
DELETE FROM auth.users WHERE email LIKE '%clientpulse%';

-- 3. Vérifier
SELECT COUNT(*) FROM auth.users;
-- Doit retourner: 0
```

---

## 📁 Fichiers de Configuration

### `.env` (Belleya)

```bash
# ============================================================================
# BELLEYA - CONFIGURATION SUPABASE
# ============================================================================

# Project URL
VITE_SUPABASE_URL=https://[belleya-ref].supabase.co

# Anon Key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.belleya...

# Project Name
VITE_PROJECT_NAME=Belleya

# Environment
VITE_ENV=development
```

### `.gitignore` (Vérifier)

```
# Environment
.env
.env.local
.env.*.local

# IMPORTANT: Ne JAMAIS commit les credentials
.env.production
.env.staging
```

---

## 📝 Récapitulatif

### Ce qui a été fait

1. ✅ Création organisation Belleya (séparée de ClientPulse)
2. ✅ Création projet Supabase Belleya
3. ✅ Migration structure DB (tables, policies, triggers, functions)
4. ✅ Configuration Storage (buckets + policies)
5. ✅ Mise à jour frontend (`.env` + code)
6. ✅ Tests end-to-end (signup, storage, CRUD)
7. ✅ Validation séparation complète

### Ce qui N'a PAS été fait (par design)

1. ❌ Migration des users (auth.users reste vide)
2. ❌ Migration des données (clients, revenues, etc.)
3. ❌ Modification du projet ClientPulse (reste inchangé)

### Prochaines Étapes

1. **Déploiement Production:**
   - Créer un projet Belleya en production (pas Free tier)
   - Appliquer les mêmes migrations
   - Configurer domaine custom (belleya.app)
   - Configurer CI/CD

2. **Monitoring:**
   - Configurer alertes Supabase (Database > Logs)
   - Monitorer erreurs signup (vérifier que triggers ne bloquent pas)
   - Monitorer usage Storage

3. **Optimisation:**
   - Ajouter indexes sur colonnes fréquemment requêtées
   - Optimiser policies RLS (si lenteur)
   - Activer pg_stat_statements pour analyser requêtes lentes

---

## 🔗 Liens Utiles

- **Dashboard Belleya:** https://supabase.com/dashboard/project/[belleya-ref]
- **Documentation Supabase:** https://supabase.com/docs
- **Guide RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Guide Storage:** https://supabase.com/docs/guides/storage

---

**Date:** 2024-01-18
**Version:** 1.0
**Auteur:** Migration automatisée
**Statut:** ✅ Guide complet - Prêt à exécuter
