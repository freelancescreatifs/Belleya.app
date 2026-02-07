# Configuration des Variables d'Environnement - Belleya

## Vue d'ensemble

Ce document explique comment configurer correctement les variables d'environnement pour le projet Belleya, en s'assurant qu'il n'y a aucune interférence avec ClientPulse.

---

## 1. Récupération des credentials Belleya

### Étape 1 : Accéder au projet Belleya
1. Se connecter à https://supabase.com/dashboard
2. Sélectionner le projet **Belleya**
3. Aller dans **Settings** > **API**

### Étape 2 : Copier les informations
Vous trouverez :
- **Project URL** : `https://xxxxx.supabase.co`
- **Project API keys** :
  - `anon` `public` : Pour le frontend (peut être exposé)
  - `service_role` : Pour le backend (JAMAIS exposer côté client)

---

## 2. Configuration du fichier .env

### Pour le développement local

Créer/modifier le fichier `.env` à la racine du projet :

```env
# ============================================================================
# BELLEYA - SUPABASE CONFIGURATION
# ============================================================================

# Project URL (remplacer par votre URL Belleya)
VITE_SUPABASE_URL=https://xxxxx.supabase.co

# Anon Key (remplacer par votre clé Belleya)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc...

# Project identifier (pour logs)
VITE_PROJECT_NAME=Belleya

# Environment
VITE_ENV=development
```

### Pour la production

Sur Netlify/Vercel, configurer les mêmes variables dans l'interface :

**Netlify :**
1. Site Settings > Build & Deploy > Environment
2. Ajouter les variables :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PROJECT_NAME=Belleya`
   - `VITE_ENV=production`

**Vercel :**
1. Project Settings > Environment Variables
2. Ajouter les mêmes variables pour Production, Preview, et Development

---

## 3. Vérification de la configuration

### Méthode 1 : Console navigateur

Ajouter un log dans `src/lib/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const projectName = import.meta.env.VITE_PROJECT_NAME || 'Unknown';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// LOG POUR IDENTIFIER L'ENVIRONNEMENT ACTIF
console.log('╔═══════════════════════════════════════════════════════╗');
console.log(`║ Supabase Project: ${projectName.padEnd(35)} ║`);
console.log(`║ URL: ${supabaseUrl.substring(0, 38).padEnd(35)} ║`);
console.log('╚═══════════════════════════════════════════════════════╝');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Au démarrage de l'app, vous devez voir dans la console :
```
╔═══════════════════════════════════════════════════════╗
║ Supabase Project: Belleya                            ║
║ URL: https://xxxxx.supabase.co                       ║
╚═══════════════════════════════════════════════════════╝
```

### Méthode 2 : Test API

Créer un fichier de test `test-supabase-connection.ts` :

```typescript
import { supabase } from './src/lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Project:', import.meta.env.VITE_PROJECT_NAME);

  // Test simple query
  const { data, error } = await supabase
    .from('user_profiles')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error);
  } else {
    console.log('✅ Connection successful');
  }
}

testConnection();
```

---

## 4. Séparation ClientPulse / Belleya

### S'assurer de la séparation complète

**À FAIRE :**
1. Supprimer toutes les anciennes variables d'environnement ClientPulse
2. Vider le cache du navigateur
3. Vérifier qu'aucune URL ClientPulse n'est hardcodée dans le code

**Commandes de vérification :**

```bash
# Chercher des URLs hardcodées
grep -r "supabase.co" src/ --exclude-dir=node_modules

# Chercher le mot "clientpulse" (insensible à la casse)
grep -ri "clientpulse" src/ --exclude-dir=node_modules

# Vérifier le fichier .env
cat .env | grep SUPABASE
```

Si vous trouvez des références à ClientPulse, les supprimer immédiatement.

---

## 5. Gestion multi-environnements (optionnel)

Si vous voulez gérer plusieurs environnements (dev/staging/prod), utilisez des fichiers .env séparés :

```
.env.development      # Développement local
.env.staging          # Environnement de test
.env.production       # Production Belleya
```

Et dans `package.json` :

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production"
  }
}
```

---

## 6. Sécurité

### ⚠️ IMPORTANT - Ne JAMAIS commit les clés

Vérifier que `.env` est dans `.gitignore` :

```bash
# .gitignore
.env
.env.local
.env.development
.env.staging
.env.production
```

### Service Role Key (backend uniquement)

Si vous avez besoin d'utiliser la `service_role` key pour des opérations admin :

1. Ne JAMAIS l'exposer côté frontend
2. L'utiliser uniquement dans des Edge Functions
3. La stocker dans les secrets Supabase (pour Edge Functions)

**Exemple dans une Edge Function :**

```typescript
// Edge Function: admin-operation/index.ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
```

---

## 7. Checklist finale

Avant de déployer :

- [ ] Variables d'environnement Belleya configurées dans `.env`
- [ ] Aucune référence à ClientPulse dans le code
- [ ] Log de démarrage affiche "Belleya"
- [ ] Test de connexion réussi (signup/login fonctionne)
- [ ] `.env` est dans `.gitignore`
- [ ] Variables configurées sur Netlify/Vercel
- [ ] Build de production testé localement (`npm run build && npm run preview`)

---

## Support

En cas de problème :

1. **Erreur "Missing Supabase environment variables"**
   - Vérifier que `.env` existe et contient les bonnes variables
   - Redémarrer le serveur de dev (`npm run dev`)

2. **Erreur 401 Unauthorized**
   - Vérifier que l'anon key est correcte
   - Vérifier qu'elle correspond bien au projet Belleya

3. **Erreur de connexion réseau**
   - Vérifier que l'URL Supabase est correcte
   - Vérifier que le projet Belleya est actif
   - Tester la connexion avec curl :
     ```bash
     curl https://xxxxx.supabase.co/rest/v1/
     ```

4. **Mauvais projet chargé**
   - Vérifier le log de démarrage dans la console
   - Supprimer le cache navigateur
   - Supprimer `.env` et le recréer
