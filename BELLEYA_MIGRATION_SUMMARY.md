# Résumé de la Migration Belleya

## 📋 Vue d'ensemble

Migration de l'application ClientPulse vers un nouveau projet Supabase "Belleya".

**Type de migration :** SCHEMA ONLY (pas de données utilisateurs)

---

## 📦 Livrables

### 1. Scripts SQL

| Fichier | Description | Utilisation |
|---------|-------------|-------------|
| `belleya_schema_complete.sql` | Schéma complet (tables, triggers, functions, RLS) | Exécuter dans SQL Editor de Belleya |
| `belleya_storage_policies.sql` | Policies pour les buckets Storage | Exécuter après création des buckets |

### 2. Documentation

| Fichier | Description |
|---------|-------------|
| `MIGRATION_BELLEYA.md` | Guide complet de migration étape par étape |
| `BELLEYA_ENV_SETUP.md` | Configuration des variables d'environnement |
| `BELLEYA_TEST_CHECKLIST.md` | Checklist détaillée de tests (23 tests) |
| `BELLEYA_MIGRATION_SUMMARY.md` | Ce fichier - résumé général |

### 3. Configuration

| Fichier | Description |
|---------|-------------|
| `.env.belleya.example` | Exemple de configuration .env pour Belleya |
| `src/lib/supabase.ts` | Client Supabase avec log d'identification |

---

## 🚀 Étapes de migration (version courte)

### 1. Créer le projet Supabase Belleya
- Nouveau projet sur supabase.com
- Noter URL et anon key

### 2. Appliquer le schéma
```bash
# Dans SQL Editor de Belleya
Exécuter: belleya_schema_complete.sql
```

### 3. Créer les buckets Storage
- `content-media` (public, 50MB max)
- `service-photos` (public)
- `project-images` (public)
- `student-documents` (privé)

### 4. Appliquer les policies Storage
```bash
# Dans SQL Editor de Belleya
Exécuter: belleya_storage_policies.sql
```

### 5. Configurer l'environnement
```bash
# Copier l'exemple
cp .env.belleya.example .env

# Éditer .env avec vos vraies credentials Belleya
```

### 6. Configurer l'authentification
- Site URL : `https://votre-domaine-belleya.com`
- Redirect URLs : `https://votre-domaine-belleya.com/**`
- Email templates (optionnel)

### 7. Build et déploiement
```bash
npm run build
# Déployer sur Netlify/Vercel avec les bonnes variables d'environnement
```

### 8. Tests
Suivre la checklist `BELLEYA_TEST_CHECKLIST.md` (23 tests)

---

## ✅ Points de validation

### Schéma de base de données

- [ ] 20+ tables créées (clients, services, revenues, agenda_events, etc.)
- [ ] 3+ triggers sur auth.users (handle_new_user, handle_new_user_profile, handle_new_company_profile)
- [ ] Policies RLS actives sur toutes les tables
- [ ] Indexes de performance créés

### Storage

- [ ] 4 buckets créés
- [ ] Policies appliquées pour chaque bucket
- [ ] Test upload dans chaque bucket réussi

### Authentification

- [ ] Signup fonctionne sans erreur 500
- [ ] user_profiles et company_profiles créés automatiquement
- [ ] Login fonctionne
- [ ] RLS isole correctement les utilisateurs

### Frontend

- [ ] Variables d'environnement Belleya configurées
- [ ] Log de démarrage affiche "Belleya"
- [ ] Aucune référence à ClientPulse dans le code
- [ ] Build de production réussi

### Sécurité

- [ ] Aucune action sur Belleya n'affecte ClientPulse
- [ ] RLS bloque accès entre utilisateurs différents
- [ ] Storage privé accessible uniquement au propriétaire

---

## 🏗️ Architecture de la base de données

### Tables principales

```
auth.users (Supabase)
├── user_profiles (profil utilisateur général)
└── company_profiles (profil entreprise - PRO uniquement)

Pro User
├── clients (liste des clients/clientes)
│   ├── client_services_history (historique prestations)
│   └── revenues (chiffre d'affaires)
├── services (catalogue de prestations)
│   └── service_supplements (suppléments)
├── agenda_events (événements calendrier)
├── tasks (tâches)
│   └── projects (projets)
├── goals (objectifs)
├── expenses (dépenses)
├── stock_items (stock)
├── students (élèves - si formation)
│   ├── student_absences
│   └── formation_documents
├── content_calendar (calendrier éditorial)
│   └── editorial_pillars (piliers éditoriaux)
└── booking_requests (demandes de réservation)
```

### Triggers critiques

| Trigger | Table | Function | Rôle |
|---------|-------|----------|------|
| `on_auth_user_created` | auth.users | `handle_new_user()` | Crée une ligne dans `profiles` (legacy) |
| `on_auth_user_created_profile` | auth.users | `handle_new_user_profile()` | Crée une ligne dans `user_profiles` |
| `on_auth_user_created_company_profile` | auth.users | `handle_new_company_profile()` | Crée une ligne dans `company_profiles` (si role='pro') |

**IMPORTANT :** Ces triggers sont essentiels. Sans eux, le signup échouera avec une erreur 500.

---

## 🔐 Sécurité RLS

Toutes les tables utilisent Row Level Security (RLS) avec des policies basées sur `auth.uid()`.

**Principe :** Chaque utilisateur ne voit que ses propres données.

**Exemple de policy :**
```sql
CREATE POLICY "Users can view own clients"
ON clients FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

---

## 📊 Buckets Storage

| Bucket | Public | Usage | Taille max |
|--------|--------|-------|-----------|
| `content-media` | Oui | Images/vidéos réseaux sociaux | 50 MB |
| `service-photos` | Oui | Photos prestations (avant/après) | Illimitée |
| `project-images` | Oui | Images projets/tâches | Illimitée |
| `student-documents` | Non | Documents privés élèves | Illimitée |

---

## ⚠️ Points d'attention

### 1. Séparation ClientPulse / Belleya

**ClientPulse et Belleya sont TOTALEMENT SÉPARÉS :**
- Projets Supabase différents
- Utilisateurs différents (aucun utilisateur en commun)
- Base de données différentes
- Storage différents

**Aucune action sur Belleya ne peut affecter ClientPulse et vice-versa.**

### 2. Données migrées

**Ce qui est migré :**
- Schéma complet (structure des tables)
- Triggers et functions
- Policies RLS
- Types ENUM et contraintes

**Ce qui N'est PAS migré :**
- Utilisateurs (auth.users reste vide)
- Données des tables (clients, services, etc.)
- Fichiers Storage
- Sessions

### 3. Première utilisation

La première fois qu'un utilisateur s'inscrit sur Belleya :
1. Un compte est créé dans `auth.users`
2. Le trigger crée automatiquement une ligne dans `user_profiles`
3. Si `role='pro'`, une ligne est créée dans `company_profiles` avec valeurs par défaut
4. L'utilisateur peut commencer à utiliser l'application

### 4. Debugging

Si problème au signup, vérifier dans la console :
```
[SignUp] Starting signup process with role: pro
[SignUp] User created successfully: <uuid>
[SignUp] Waiting for triggers to complete...
[SignUp] Loading user profile...
[LoadProfile] Loading profile for user: <uuid>
[LoadProfile] Profile loaded successfully: pro
```

Si une de ces étapes échoue, consulter les logs Supabase (Database > Logs).

---

## 🆘 Support et résolution de problèmes

### Erreur 500 au signup
**Cause :** Triggers manquants ou échouent
**Solution :**
1. Vérifier que les 3 triggers existent sur `auth.users`
2. Vérifier que les functions utilisent `SECURITY DEFINER`
3. Vérifier que `company_profiles` a des valeurs par défaut pour les colonnes NOT NULL

### Erreur 400 sur company_profiles
**Cause :** Colonne inexistante dans la requête
**Solution :**
1. Vérifier que la colonne demandée existe (ex: `primary_profession` et non `profession_type`)
2. Vérifier que la ligne existe (après signup)

### Upload Storage échoue
**Cause :** Buckets ou policies manquants
**Solution :**
1. Vérifier que les buckets existent (Storage > Buckets)
2. Vérifier que les policies sont appliquées
3. Tester avec un fichier < 1MB d'abord

### RLS bloque accès légitime
**Cause :** Policy trop restrictive ou auth.uid() null
**Solution :**
1. Vérifier que l'utilisateur est bien connecté
2. Vérifier la policy avec `EXPLAIN` en SQL
3. Temporairement désactiver RLS pour tester (ATTENTION : uniquement en dev)

---

## 📞 Contact

Pour toute question ou problème durant la migration, consulter :
1. `MIGRATION_BELLEYA.md` - Guide détaillé
2. `BELLEYA_TEST_CHECKLIST.md` - Tests de validation
3. Logs Supabase : Database > Logs
4. Logs navigateur : Console (F12)

---

## ✨ Prochaines étapes après migration

Une fois la migration validée :

1. **Marketing :** Annoncer le lancement de Belleya
2. **Support :** Former l'équipe sur les nouveaux comptes
3. **Monitoring :** Surveiller les logs pour détecter les problèmes
4. **Backup :** Mettre en place une stratégie de sauvegarde
5. **Performance :** Optimiser les requêtes si nécessaire

---

**Version :** 1.0
**Date :** 2024-01-18
**Statut :** Prêt pour migration
