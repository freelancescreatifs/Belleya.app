# 🚀 GUIDE DE DÉPLOIEMENT URGENT

## ✅ Statut actuel

- ✅ Code modifié avec toutes les couleurs en ROSE
- ✅ Build de production créé dans le dossier `dist/`
- ✅ Tous les changements sont prêts à être déployés
- ❌ Le site https://belleya.app n'a PAS encore ces changements

## 🎯 COMMENT DÉPLOYER MAINTENANT

Vous devez uploader le contenu du dossier **dist/** vers votre hébergeur. Voici comment selon votre plateforme :

### Option 1 : Netlify (Recommandé si vous utilisez Netlify)

#### Via le Dashboard Netlify (le plus simple)

1. **Allez sur** https://app.netlify.com
2. **Connectez-vous** à votre compte
3. **Trouvez** votre site "belleya"
4. **Cliquez** sur "Deploys" dans le menu
5. **Faites glisser** le dossier `dist/` entier dans la zone "Drag and drop your site output folder here"
6. **Attendez** 30 secondes - le site sera mis à jour automatiquement

#### Via Netlify CLI (si installé)

```bash
# Installer Netlify CLI (si pas déjà fait)
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod --dir=dist
```

### Option 2 : Vercel (Si vous utilisez Vercel)

#### Via le Dashboard Vercel

1. **Allez sur** https://vercel.com/dashboard
2. **Trouvez** votre projet "belleya"
3. **Cliquez** sur "..." puis "Redeploy"

#### Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

### Option 3 : FTP / Hébergeur traditionnel

1. **Ouvrez** votre client FTP (FileZilla, Cyberduck, etc.)
2. **Connectez-vous** à votre serveur
3. **Trouvez** le dossier public_html / www / htdocs
4. **Supprimez** tous les anciens fichiers
5. **Uploadez** tout le contenu du dossier `dist/`
6. **Vérifiez** que le fichier `index.html` est bien à la racine

### Option 4 : Hébergement GitHub Pages

```bash
# Installer gh-pages
npm install -g gh-pages

# Déployer
gh-pages -d dist
```

## 📦 Contenu du dossier dist/ à déployer

Le dossier `dist/` contient :
```
dist/
├── index.html                     (Page principale)
├── assets/
│   ├── index-c9Vi19p-.js         (JavaScript - 1.8MB)
│   ├── index-C75qHMwE.css        (CSS - 174KB)
│   └── mapbox-gl-DkecWI6l.js     (Mapbox - 1.7MB)
├── _redirects                     (Config Netlify)
├── .htaccess                      (Config Apache)
├── vercel.json                    (Config Vercel)
├── [images et autres fichiers]
```

## ⚠️ IMPORTANT : Vider le cache après déploiement

Une fois déployé, videz le cache de votre navigateur :

**Chrome/Edge/Brave:**
```
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)
→ Cocher "Images et fichiers en cache"
→ Effacer
```

**Firefox:**
```
Ctrl + Shift + Delete
→ Cocher "Cache"
→ OK
```

**Safari:**
```
Cmd + Option + E (vider le cache)
```

Ou faites un **Hard Reload:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

## 🔍 Vérification après déploiement

Allez sur https://belleya.app/book/nailsaabrx et vérifiez :

- [ ] Header avec dégradé rose/pink
- [ ] Tous les boutons en rose
- [ ] Stats : ⭐ avis, 👥 abonnés, ❤️ likes, 📸 photos
- [ ] Adresse complète visible
- [ ] 4 onglets : Services, Galerie, Avis, Institut
- [ ] Photos de l'institut dans l'onglet "Institut"
- [ ] Services avec miniatures (96x96px)
- [ ] Suppléments détaillés (nom + durée + prix)
- [ ] Calendrier en rose
- [ ] Créneaux horaires disponibles

## 🆘 Si ça ne marche toujours pas

1. **Attendez 5 minutes** (le CDN peut prendre du temps)
2. **Videz le cache** du navigateur (Ctrl+Shift+R)
3. **Testez en navigation privée** (Ctrl+Shift+N)
4. **Vérifiez** que vous avez bien uploadé le dossier `dist/` et pas un autre
5. **Contactez** le support de votre hébergeur

## 📝 Quelle plateforme utilisez-vous ?

Si vous ne savez pas comment déployer, dites-moi :
- Quel hébergeur utilisez-vous ? (Netlify, Vercel, OVH, autre ?)
- Avez-vous accès au dashboard de l'hébergeur ?
- Avez-vous un accès FTP ?

Je pourrai vous donner des instructions plus précises.
