# 🚀 Belleya - Guide Rapide de Migration

## ⏱️ Temps estimé : 30-45 minutes

Ce guide vous permet de migrer rapidement vers Belleya.

---

## 📋 Checklist Pré-migration

Avant de commencer, assurez-vous d'avoir :

- [ ] Accès au dashboard Supabase
- [ ] Droits pour créer un nouveau projet
- [ ] Accès au code source de l'application
- [ ] Accès au déploiement (Netlify/Vercel)

---

## 🎯 Étapes (10 étapes simples)

### ☐ 1. Créer le projet Supabase Belleya (2 min)

1. Aller sur https://supabase.com/dashboard
2. Cliquer sur **New Project**
3. Nom : `Belleya`
4. Choisir une région (ex: Europe West)
5. Définir un mot de passe DB
6. Attendre la création (30 secondes)

**Résultat :** Projet créé ✅

---

### ☐ 2. Noter les credentials (1 min)

1. Dans le projet Belleya : **Settings** > **API**
2. Copier :
   - `Project URL` : `https://xxxxx.supabase.co`
   - `anon public` key

**Résultat :** Credentials notés ✅

---

### ☐ 3. Appliquer le schéma complet (3 min)

1. Aller dans **SQL Editor**
2. Ouvrir le fichier `belleya_schema_complete.sql`
3. Copier tout le contenu
4. Coller dans SQL Editor
5. Cliquer sur **Run**
6. Attendre 10-20 secondes

**Résultat :** Schéma migré ✅

**Vérification :**
```sql
-- Compter les tables créées (doit être ~20+)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

---

### ☐ 4. Créer les buckets Storage (3 min)

Dans **Storage**, créer les 4 buckets :

1. **content-media**
   - Public : ✅
   - File size limit : 52428800 (50 MB)
   - Allowed MIME : `image/jpeg, image/jpg, image/png, image/gif, image/webp, video/mp4, video/quicktime, video/webm`

2. **service-photos**
   - Public : ✅
   - Pas de limite
   - Tous types

3. **project-images**
   - Public : ✅
   - Pas de limite
   - Tous types

4. **student-documents**
   - Public : ❌ (privé)
   - Pas de limite
   - Tous types

**Résultat :** 4 buckets créés ✅

---

### ☐ 5. Appliquer les policies Storage (2 min)

1. Retour dans **SQL Editor**
2. Ouvrir `belleya_storage_policies.sql`
3. Copier tout le contenu
4. Coller et **Run**

**Résultat :** Policies Storage appliquées ✅

---

### ☐ 6. Configurer l'authentification (2 min)

Dans **Authentication** > **Settings** :

1. **Site URL :**
   ```
   https://votre-domaine-belleya.com
   ```

2. **Redirect URLs :**
   ```
   https://votre-domaine-belleya.com/**
   http://localhost:5173/**
   ```

3. **Enable email confirmations :** OFF (pour dev rapide)

**Résultat :** Auth configurée ✅

---

### ☐ 7. Configurer .env local (2 min)

1. Copier le fichier exemple :
   ```bash
   cp .env.belleya.example .env
   ```

2. Éditer `.env` avec vos vraies credentials Belleya :
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   VITE_PROJECT_NAME=Belleya
   VITE_ENV=development
   ```

3. Redémarrer le serveur dev :
   ```bash
   npm run dev
   ```

**Résultat :** Variables configurées ✅

**Vérification :**
Ouvrir http://localhost:5173 et vérifier la console :
```
╔═══════════════════════════════════════════════════════════════╗
║ 🚀 Supabase Project: Belleya                                  ║
║ 🌐 URL: https://xxxxx.supabase.co                            ║
║ 🛠️  Environment: development                                  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### ☐ 8. Tester le signup (3 min)

1. Aller sur la page d'inscription (mode PRO)
2. S'inscrire avec :
   - Email : `test@belleya.com`
   - Prénom : `Test`
   - Nom : `Belleya`
   - Mot de passe : `Test123!`

**Résultats attendus :**
- [ ] Pas d'erreur 500
- [ ] Redirection vers dashboard
- [ ] Console : logs `[SignUp] User created successfully`

**SI ERREUR :**
1. Ouvrir la console (F12)
2. Vérifier les logs détaillés
3. Vérifier que les triggers existent :
   ```sql
   SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';
   ```

**Résultat :** Signup fonctionne ✅

---

### ☐ 9. Tester un upload Storage (2 min)

1. Aller dans **Clients**
2. Créer un client
3. Ajouter une photo au client

**Résultats attendus :**
- [ ] Upload réussi
- [ ] Photo affichée
- [ ] Pas d'erreur CORS

**Résultat :** Storage fonctionne ✅

---

### ☐ 10. Build et déploiement (5 min)

1. Tester le build localement :
   ```bash
   npm run build
   npm run preview
   ```

2. Si build OK, déployer sur Netlify/Vercel :

   **Netlify :**
   - Settings > Environment Variables
   - Ajouter les 3 variables :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_PROJECT_NAME=Belleya`
   - Déployer

   **Vercel :**
   - Settings > Environment Variables
   - Ajouter les mêmes variables
   - Pour Production, Preview et Development
   - Déployer

**Résultat :** Application déployée ✅

---

## ✅ Validation finale (5 min)

Tester sur l'environnement de production :

- [ ] Ouvrir l'URL de prod
- [ ] Vérifier le log de démarrage (console) : "Belleya"
- [ ] Créer un compte
- [ ] Se connecter
- [ ] Créer un client
- [ ] Uploader une image
- [ ] Créer un événement dans l'agenda

**SI TOUS LES TESTS PASSENT :** Migration réussie ! 🎉

---

## 🐛 Problèmes courants

### Erreur : "Missing Supabase environment variables"
**Solution :** Vérifier `.env`, redémarrer `npm run dev`

### Erreur 500 au signup
**Solution :**
```sql
-- Vérifier les triggers
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';
```
Doit retourner 3 triggers.

### Upload échoue
**Solution :** Vérifier que les buckets existent et que les policies sont appliquées.

### Mauvais projet chargé
**Solution :** Supprimer cache navigateur, vérifier `.env`, vérifier log console.

---

## 📊 Résumé

| Étape | Temps | Statut |
|-------|-------|--------|
| 1. Créer projet | 2 min | ☐ |
| 2. Credentials | 1 min | ☐ |
| 3. Schéma DB | 3 min | ☐ |
| 4. Buckets | 3 min | ☐ |
| 5. Policies Storage | 2 min | ☐ |
| 6. Auth config | 2 min | ☐ |
| 7. .env local | 2 min | ☐ |
| 8. Test signup | 3 min | ☐ |
| 9. Test upload | 2 min | ☐ |
| 10. Déploiement | 5 min | ☐ |
| **TOTAL** | **~25 min** | |

---

## 📚 Documentation complète

Pour plus de détails, consulter :

- **MIGRATION_BELLEYA.md** - Guide complet et détaillé
- **BELLEYA_ENV_SETUP.md** - Configuration environnement
- **BELLEYA_TEST_CHECKLIST.md** - 23 tests de validation
- **BELLEYA_MIGRATION_SUMMARY.md** - Résumé technique

---

## 🎯 Prochaines étapes

Une fois la migration validée :

1. **Tests complets :** Suivre `BELLEYA_TEST_CHECKLIST.md`
2. **Formation équipe :** Présenter Belleya
3. **Monitoring :** Surveiller les logs pendant 48h
4. **Optimisation :** Analyser les performances
5. **Backup :** Planifier les sauvegardes

---

**Bon courage ! 🚀**
