# Guide de Collaboration - Belleya

Ce document explique comment collaborer efficacement sur le projet Belleya.

## Méthode 1 : GitHub (Recommandé)

### Configuration initiale par le propriétaire

```bash
# 1. Créer un nouveau repo sur GitHub
# Aller sur github.com → New repository → belleya

# 2. Initialiser Git localement
git init
git add .
git commit -m "Initial commit"

# 3. Lier au repo GitHub
git remote add origin https://github.com/VOTRE-USERNAME/belleya.git
git branch -M main
git push -u origin main
```

### Inviter un collaborateur

1. Sur GitHub, allez dans votre repo
2. Settings → Collaborators and teams
3. Add people → Entrez l'email ou le username GitHub
4. Sélectionnez le niveau d'accès (Write ou Admin)

### Setup pour le nouveau membre

```bash
# 1. Cloner le projet
git clone https://github.com/VOTRE-USERNAME/belleya.git
cd belleya

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env

# 4. Demander au propriétaire les clés Supabase
# Éditer .env avec les bonnes valeurs

# 5. Lancer le projet
npm run dev
```

## Méthode 2 : GitLab / Bitbucket

Même principe que GitHub, créez un compte sur la plateforme choisie.

## Méthode 3 : Partage direct (temporaire)

### Via ZIP

```bash
# Créer une archive
zip -r belleya-project.zip . -x "*.git*" -x "*node_modules*" -x "*dist*"

# Partager via WeTransfer, Dropbox, Google Drive, etc.
```

Le membre devra ensuite :
```bash
# Décompresser
unzip belleya-project.zip
cd belleya

# Installer et configurer
npm install
cp .env.example .env
# Éditer .env avec les clés Supabase
```

## Partage des Accès Supabase

### Option 1 : Inviter sur Supabase (Recommandé)

1. Connexion sur https://supabase.com
2. Sélectionnez votre projet Belleya
3. Settings → Team Settings
4. Invite team member
5. Entrez l'email du collaborateur
6. Choisissez le rôle :
   - **Admin** : Peut tout gérer sauf facturation
   - **Developer** : Accès développement uniquement

### Option 2 : Partager les clés (moins sécurisé)

Envoyez via un canal sécurisé :
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

**Important** : Ne partagez JAMAIS la `service_role` key en public.

## Workflow de Développement Recommandé

### Système de branches

```bash
# main - Production
# develop - Développement
# feature/nom-feature - Nouvelles fonctionnalités
# fix/nom-bug - Corrections de bugs
```

### Pour créer une nouvelle fonctionnalité

```bash
# 1. Mettre à jour main
git checkout main
git pull origin main

# 2. Créer une branche
git checkout -b feature/nom-de-ma-feature

# 3. Développer et committer
git add .
git commit -m "Ajout de la fonctionnalité X"

# 4. Pousser sur GitHub
git push origin feature/nom-de-ma-feature

# 5. Créer une Pull Request sur GitHub
# Review du code par l'équipe

# 6. Merge après validation
```

### Commandes Git essentielles

```bash
# Voir l'état des fichiers
git status

# Récupérer les dernières modifications
git pull

# Créer un commit
git add .
git commit -m "Description claire des changements"

# Envoyer sur GitHub
git push

# Changer de branche
git checkout nom-branche

# Créer une nouvelle branche
git checkout -b nouvelle-branche

# Voir l'historique
git log --oneline

# Annuler les modifications locales
git reset --hard
```

## Bonnes Pratiques

### Commits

- Commits fréquents et atomiques
- Messages clairs en français
- Format : `Type: Description`
  - `feat: Ajout du système de notifications`
  - `fix: Correction du bug de connexion`
  - `refactor: Amélioration du code de paiement`
  - `docs: Mise à jour du README`

### Code Review

Avant de merger une Pull Request, vérifier :
- Le code fonctionne localement
- Pas d'erreurs console
- Les tests passent (si existants)
- Le code respecte les conventions du projet
- La documentation est à jour si nécessaire

### Structure des branches

```
main (production)
  └── develop (développement)
       ├── feature/nouveau-module
       ├── feature/amelioration-ui
       └── fix/correction-bug
```

## Résolution de Conflits

Si Git signale des conflits :

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Git marque les conflits dans les fichiers
# Ouvrir les fichiers concernés et résoudre manuellement

# 3. Marquer comme résolu
git add fichier-resolu.tsx

# 4. Finir le merge
git commit -m "Résolution des conflits"

# 5. Pousser
git push
```

## Communication en Équipe

### Outils recommandés

- **Code** : GitHub / GitLab
- **Communication** : Slack / Discord / WhatsApp
- **Tâches** : GitHub Projects / Trello / Notion
- **Documentation** : Notion / Confluence

### Daily Standup (optionnel)

Chaque jour, chaque membre partage :
1. Ce que j'ai fait hier
2. Ce que je fais aujourd'hui
3. Mes blocages éventuels

## Gestion des Environnements

### Développement Local

```
http://localhost:5173
Base de données : Supabase (environnement partagé)
```

### Staging / Production

Considérez créer des projets Supabase séparés :
- `belleya-dev` : Pour le développement
- `belleya-prod` : Pour la production

## Checklist pour Nouveau Membre

- [ ] Compte GitHub créé
- [ ] Accès au repo Belleya
- [ ] Node.js installé
- [ ] Git configuré (`git config --global user.name "Nom"`)
- [ ] Projet cloné
- [ ] `npm install` réussi
- [ ] Fichier `.env` configuré
- [ ] Accès Supabase accordé
- [ ] Application lance en local
- [ ] Premier commit de test effectué

## Dépannage Rapide

### Erreur "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur Supabase "Invalid API key"
- Vérifier le fichier `.env`
- Vérifier que les clés sont correctes
- Redémarrer le serveur (`npm run dev`)

### Conflits Git
```bash
git stash          # Mettre de côté vos changements
git pull           # Récupérer les changements distants
git stash pop      # Réappliquer vos changements
```

## Contact Support

- Documentation : Voir les fichiers `*.md` à la racine
- Questions : Créer une Issue sur GitHub
- Urgent : WhatsApp https://chat.whatsapp.com/FkLVwP6EDMNCOO4PkASezY
