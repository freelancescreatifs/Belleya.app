# Migration ClientPulse vers Belleya

## Vue d'ensemble

Ce document guide la migration de l'application ClientPulse vers un nouveau projet Supabase "Belleya" en migrant **uniquement le schéma** (pas les utilisateurs ni les données).

---

## 1. Configuration du nouveau projet Supabase

### 1.1 Créer le projet Belleya
1. Aller sur https://supabase.com/dashboard
2. Créer un nouveau projet nommé "Belleya"
3. Choisir une région (idéalement proche de vos utilisateurs)
4. Définir un mot de passe pour la base de données

### 1.2 Récupérer les credentials
Depuis les Settings > API du projet Belleya :
- `Project URL` (ex: https://xxxxx.supabase.co)
- `anon public key`
- `service_role key` (garder secret, pour admin uniquement)

---

## 2. Migration du schéma de base de données

### 2.1 Appliquer le schéma complet

Le fichier `belleya_schema_complete.sql` contient :
- Tous les types ENUM
- Toutes les tables avec contraintes et index
- Tous les triggers et functions
- Toutes les policies RLS
- Toutes les vues (views)

**Exécution :**

Via l'interface Supabase :
1. Aller dans SQL Editor de Belleya
2. Copier le contenu de `belleya_schema_complete.sql`
3. Exécuter le script

OU via CLI Supabase locale :
```bash
# Se connecter au projet Belleya
supabase link --project-ref <BELLEYA_PROJECT_REF>

# Appliquer la migration
psql postgresql://postgres:<PASSWORD>@<BELLEYA_HOST>:5432/postgres -f belleya_schema_complete.sql
```

### 2.2 Vérification du schéma

Après migration, vérifier que les éléments suivants existent :

**Tables principales :**
- `profiles` (ancienne table, peut-être legacy)
- `user_profiles` (table profils utilisateurs)
- `company_profiles` (profils entreprises)
- `clients` (clients/clientes)
- `services` (prestations)
- `service_supplements` (suppléments de prestation)
- `revenues` (chiffre d'affaires)
- `expenses` (dépenses)
- `stock_items` (stock)
- `goals` (objectifs)
- `tasks` (tâches)
- `projects` (projets)
- `agenda_events` (événements agenda)
- `students` (élèves/apprenants)
- `student_absences` (absences)
- `formation_documents` (documents de formation)
- `booking_requests` (demandes de réservation)
- `content_calendar` (calendrier éditorial)
- `editorial_pillars` (piliers éditoriaux)
- `educational_content` (contenus pédagogiques)

**Triggers à vérifier :**
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

Triggers critiques attendus :
- `on_auth_user_created` sur `auth.users` → `handle_new_user()`
- `on_auth_user_created_profile` sur `auth.users` → `handle_new_user_profile()`
- `on_auth_user_created_company_profile` sur `auth.users` → `handle_new_company_profile()`
- `set_updated_at_*` sur plusieurs tables → `update_updated_at()`

---

## 3. Configuration du Storage

### 3.1 Créer les buckets

Aller dans Storage de Belleya et créer les buckets suivants :

#### Bucket 1 : `content-media`
- **Public :** Oui
- **File size limit :** 50 MB (52428800 bytes)
- **Allowed MIME types :**
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - video/mp4
  - video/quicktime
  - video/webm

#### Bucket 2 : `service-photos`
- **Public :** Oui
- **File size limit :** Aucune limite
- **Allowed MIME types :** Tous

#### Bucket 3 : `project-images`
- **Public :** Oui
- **File size limit :** Aucune limite
- **Allowed MIME types :** Tous

#### Bucket 4 : `student-documents`
- **Public :** Non (privé)
- **File size limit :** Aucune limite
- **Allowed MIME types :** Tous

### 3.2 Appliquer les policies Storage

Le script `belleya_storage_policies.sql` contient toutes les policies pour les buckets.

Exécuter dans SQL Editor :
```sql
-- Voir le fichier belleya_storage_policies.sql
```

---

## 4. Configuration de l'authentification

### 4.1 Auth Settings de Belleya

Dans Authentication > Settings :

**Site URL :**
```
https://votre-domaine-belleya.com
```

**Redirect URLs :**
```
https://votre-domaine-belleya.com/**
http://localhost:5173/**
http://localhost:4173/**
```

**Email Templates :**
- Personnaliser les templates de confirmation, réinitialisation mot de passe, etc.
- Remplacer les URLs {{ .ConfirmationURL }} pour pointer vers Belleya

**Providers :**
- Si vous utilisez Google/Facebook OAuth, reconfigurer avec les nouvelles credentials Belleya

### 4.2 Désactiver la confirmation d'email (optionnel)

Si vous voulez permettre l'inscription immédiate sans email :

Authentication > Settings > Email Auth :
- **Enable email confirmations :** OFF

---

## 5. Configuration du Frontend

### 5.1 Variables d'environnement

Créer un fichier `.env` pour Belleya :

```env
# Projet Belleya - PRODUCTION
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Pour identifier l'environnement
VITE_PROJECT_NAME=Belleya
```

### 5.2 Vérifier l'absence de références ClientPulse

Chercher dans le code toutes les références hardcodées :

```bash
# Rechercher des URLs hardcodées
grep -r "clientpulse" src/
grep -r "supabase.co" src/

# Vérifier le fichier .env
cat .env
```

S'assurer qu'aucune URL ClientPulse n'apparaît.

### 5.3 Ajouter un log de démarrage

Dans `src/lib/supabase.ts`, ajouter un log :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log pour identifier l'environnement actif
console.log(`[Supabase] Connected to: ${supabaseUrl}`);
console.log(`[Supabase] Project: ${import.meta.env.VITE_PROJECT_NAME || 'Unknown'}`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 6. Déploiement

### 6.1 Build de production

```bash
npm run build
```

Vérifier que le build contient les bonnes variables d'environnement Belleya.

### 6.2 Déployer sur Netlify/Vercel

Configurer les variables d'environnement dans Netlify/Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PROJECT_NAME=Belleya`

---

## 7. Tests post-migration

### 7.1 Checklist de validation

- [ ] **Signup :** Créer un nouveau compte pro
  - Vérifier que l'inscription fonctionne sans erreur 500
  - Vérifier qu'une ligne est créée dans `user_profiles`
  - Vérifier qu'une ligne est créée dans `company_profiles`

- [ ] **Login :** Se connecter avec le compte créé
  - Login réussi
  - Redirection vers le dashboard

- [ ] **Company Profile :**
  - Accéder aux paramètres
  - Modifier le profil entreprise (nom, statut légal, etc.)
  - Vérifier que les changements sont sauvegardés

- [ ] **Clients :**
  - Créer un nouveau client
  - Uploader une photo (bucket `service-photos`)
  - Vérifier que la photo s'affiche

- [ ] **Agenda :**
  - Créer un événement
  - Vérifier qu'il apparaît dans le calendrier

- [ ] **Content (Social Media) :**
  - Créer un post Instagram
  - Uploader une image (bucket `content-media`)
  - Vérifier que l'upload fonctionne

- [ ] **Formation :**
  - Créer un élève
  - Uploader un document (bucket `student-documents`)
  - Vérifier que seul le proprio peut voir le document

- [ ] **Pas d'interférence avec ClientPulse :**
  - Vérifier que ClientPulse fonctionne toujours normalement
  - Vérifier qu'aucune action sur Belleya n'affecte ClientPulse

### 7.2 Tests de sécurité RLS

Tester avec 2 comptes différents :

```bash
# Compte A crée un client
# Compte B essaie d'accéder au client de A -> doit échouer

# Compte A crée un document privé
# Compte B essaie de télécharger le document -> doit échouer
```

---

## 8. Rollback en cas de problème

Si la migration échoue :

1. **Ne pas toucher à ClientPulse** - il reste intact
2. Supprimer le projet Belleya sur Supabase
3. Recréer un nouveau projet et recommencer

ClientPulse n'est jamais impacté car aucune donnée n'en a été exportée.

---

## 9. Notes importantes

### Différences ClientPulse vs Belleya

- **Utilisateurs :** Complètement séparés. Aucun utilisateur ClientPulse n'existe dans Belleya.
- **Fichiers :** Les fichiers restent sur ClientPulse (pas copiés). Belleya démarre avec un storage vide.
- **Base de données :** Schéma identique, mais données vides dans Belleya.

### Points d'attention

1. **Triggers d'auto-création :**
   - Les triggers `handle_new_user`, `handle_new_user_profile`, et `handle_new_company_profile` sont critiques
   - Ils créent automatiquement les profils à l'inscription
   - Sans eux, l'inscription échouera avec une erreur 500

2. **RLS (Row Level Security) :**
   - Toutes les tables ont RLS activé
   - Les policies utilisent `auth.uid()` pour filtrer les données
   - Chaque utilisateur ne voit que ses propres données

3. **Storage Policies :**
   - Les buckets publics permettent lecture à tous
   - L'upload est restreint aux utilisateurs authentifiés
   - Les buckets privés (`student-documents`) nécessitent auth + ownership

---

## Support

En cas de problème durant la migration :

1. Vérifier les logs dans la console navigateur (erreurs détaillées)
2. Vérifier les logs Supabase (Database > Logs)
3. Vérifier que tous les triggers existent
4. Vérifier que les variables d'environnement sont correctes
