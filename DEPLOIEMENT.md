# Configuration du cache pour Belleya

## Problème résolu
Certains utilisateurs voyaient l'ancienne version de l'application à cause du cache du navigateur.

## Solutions mises en place

### 1. Headers HTTP de cache
Configurations ajoutées pour tous les types d'hébergement :

- **index.html** : Aucun cache (rechargé à chaque visite)
- **Assets JS/CSS** : Cache permanent (les fichiers ont des hash uniques)

### 2. Fichiers de configuration créés

#### Pour Netlify
- `netlify.toml` : Configuration des headers et redirections
- `_redirects` : Configuration de routing

#### Pour Vercel
- `vercel.json` : Configuration des headers et routing

#### Pour Apache
- `.htaccess` : Configuration pour serveurs Apache

### 3. Meta tags HTML
Ajout de meta tags dans `index.html` pour forcer le no-cache

## Résultat
- ✅ Les utilisateurs verront toujours la dernière version
- ✅ Les assets sont cachés pour de meilleures performances
- ✅ Compatible avec tous les hébergeurs (Netlify, Vercel, Apache)

## Déploiement
Après chaque déploiement, tous les utilisateurs recevront automatiquement la nouvelle version lors de leur prochaine visite.

### Pour forcer la mise à jour immédiate
Les utilisateurs peuvent :
1. Faire un Ctrl+F5 (ou Cmd+Shift+R sur Mac)
2. Vider le cache du navigateur
