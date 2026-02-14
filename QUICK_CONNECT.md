# ⚡ Connexion Rapide à Bolt.new

## 🎯 Commandes à copier-coller

### Créez d'abord le repository sur GitHub :
👉 https://github.com/organizations/application-belleya/repositories/new
- Repository name : `belleya-app`
- Private
- **NE PAS** initialiser avec README

### Puis exécutez ces commandes :

```bash
# 1. Initialiser Git
git init

# 2. Ajouter tous les fichiers
git add .

# 3. Commit
git commit -m "feat: Initial commit - Belleya application"

# 4. Ajouter le remote (REMPLACEZ avec votre URL)
git remote add origin https://github.com/application-belleya/belleya-app.git

# 5. Renommer la branche
git branch -M main

# 6. Push
git push -u origin main
```

### Enfin, sur Bolt.new :
1. Allez sur **https://bolt.new**
2. Cliquez sur **"Import from GitHub"**
3. Sélectionnez : **application-belleya/belleya-app**
4. Ajoutez les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MAPBOX_TOKEN`

## ✅ C'est tout !

Votre équipe peut maintenant collaborer sur Bolt.new 🎉
