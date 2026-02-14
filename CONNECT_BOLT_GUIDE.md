# 🚀 Connecter Belleya à Bolt.new

## Option 1 : Script Automatique (Recommandé)

### Sur Mac/Linux :
```bash
bash connect-to-bolt.sh
```

### Sur Windows :
```cmd
connect-to-bolt.bat
```

Le script va :
1. ✅ Initialiser Git
2. ✅ Configurer .gitignore
3. ✅ Configurer le remote GitHub
4. ✅ Commit tous les fichiers
5. ✅ Push vers GitHub

---

## Option 2 : Commandes Manuelles

Si vous préférez exécuter les commandes une par une :

### Étape 1 : Initialiser Git
```bash
git init
```

### Étape 2 : Ajouter tous les fichiers
```bash
git add .
```

### Étape 3 : Créer le commit initial
```bash
git commit -m "feat: Initial commit - Belleya application"
```

### Étape 4 : Ajouter le remote GitHub
```bash
# Remplacez par l'URL de votre repository
git remote add origin https://github.com/application-belleya/belleya-app.git
```

### Étape 5 : Renommer la branche en main
```bash
git branch -M main
```

### Étape 6 : Push vers GitHub
```bash
git push -u origin main
```

---

## Après le Push : Connecter à Bolt.new

### 1️⃣ Créer le repository sur GitHub

Si ce n'est pas déjà fait :

1. Allez sur : https://github.com/organizations/application-belleya/repositories/new
2. **Repository name** : `belleya-app`
3. **Visibility** : Private (recommandé)
4. **Ne cochez pas** "Initialize this repository with a README"
5. Cliquez sur **Create repository**

### 2️⃣ Importer dans Bolt.new

1. Allez sur **https://bolt.new**

2. Cliquez sur **"Import from GitHub"** ou **"Connect GitHub"**

3. Autorisez Bolt à accéder à votre compte GitHub

4. Sélectionnez votre organisation : **application-belleya**

5. Sélectionnez votre repository : **belleya-app**

6. Bolt va automatiquement :
   - Cloner le projet
   - Installer les dépendances
   - Configurer l'environnement

### 3️⃣ Configurer les variables d'environnement dans Bolt

Dans Bolt.new, ajoutez ces variables :

```env
VITE_SUPABASE_URL=https://lldznuayrxzvliehywoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZHpudWF5cnh6dmxpZWh5d29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODk4MjUsImV4cCI6MjA1MjM2NTgyNX0.gEWzp_KcK4UyKnN_hxHTnL8zAYT1Z1Tqa9dQSyb1Jlg
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

---

## ✅ C'est prêt !

Vous pouvez maintenant :
- ✨ Modifier le projet dans Bolt.new
- 👥 Collaborer avec votre équipe
- 🚀 Déployer automatiquement
- 🔄 Synchroniser avec GitHub

---

## 🆘 Résolution de problèmes

### Erreur : "Permission denied"

**Cause** : Vous n'avez pas les droits d'écriture sur le repository.

**Solution** :
1. Vérifiez que vous êtes membre de l'organisation `application-belleya`
2. Vérifiez que vous avez les droits "Write" ou "Admin" sur le repository

### Erreur : "Repository not found"

**Cause** : Le repository n'existe pas encore sur GitHub.

**Solution** : Créez-le d'abord sur GitHub :
https://github.com/organizations/application-belleya/repositories/new

### Erreur : "Authentication failed"

**Cause** : GitHub demande vos identifiants.

**Solution** : Utilisez un Personal Access Token :

```bash
# Configurez votre token
git config --global credential.helper store

# Puis re-essayez le push
# Quand demandé, utilisez :
# Username: votre-username
# Password: ghp_votre_token_github
```

### Bolt.new ne trouve pas le repository

**Cause** : Le repository est peut-être privé et Bolt n'a pas accès.

**Solution** :
1. Sur GitHub, allez dans **Settings** du repository
2. **Manage access** > **Invite teams or people**
3. Ajoutez l'application Bolt.new

---

## 📋 Checklist finale

Avant de commencer à travailler sur Bolt.new :

- [ ] Repository créé sur GitHub
- [ ] Code pushé sur la branche `main`
- [ ] Bolt.new connecté au repository
- [ ] Variables d'environnement configurées dans Bolt
- [ ] Le projet se lance sans erreur dans Bolt
- [ ] Tous les membres de l'équipe ont accès au repository
- [ ] Tous les membres ont accès à Bolt.new

---

**Créé le** : 14 février 2026
**Pour** : Équipe application-belleya
**Support** : Si vous avez des questions, consultez le TEAM_SETUP_GUIDE.md
