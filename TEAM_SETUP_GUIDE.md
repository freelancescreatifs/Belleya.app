# Guide Configuration Team - Belleya

## 🎯 Ajouter le projet à votre GitHub Team

### Étape 1 : Créer un Personal Access Token

1. **Allez sur GitHub.com**
2. Cliquez sur votre **photo de profil** > **Settings**
3. Menu de gauche tout en bas : **Developer settings**
4. **Personal access tokens** > **Tokens (classic)**
5. **Generate new token** > **Generate new token (classic)**

### Étape 2 : Configurer le token

**Nom du token** :
```
belleya-team-access
```

**Expiration** : 90 jours (ou selon vos préférences)

**Scopes à cocher** :

```
☑️ repo (Full control of private repositories)
☑️ admin:org (Full control of orgs and teams)
  ☑️ write:org
  ☑️ read:org
☑️ workflow (Update GitHub Action workflows)
```

### Étape 3 : Copier le token

Après avoir cliqué sur "Generate token", copiez immédiatement le token :

```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT** : Vous ne pourrez plus le revoir après avoir quitté la page !

---

## 🏢 Ajouter le projet à votre organisation GitHub

### Option A : Transférer le repository existant

1. Allez sur votre repository GitHub
2. **Settings** > **General**
3. Tout en bas : **Danger Zone** > **Transfer ownership**
4. Entrez le nom de votre organisation : `application-belleya`
5. Confirmez

### Option B : Créer un nouveau repository dans l'organisation

1. Sur GitHub, cliquez sur le **+** en haut à droite
2. **New repository**
3. **Owner** : Sélectionnez `application-belleya`
4. **Repository name** : `belleya-app`
5. **Create repository**

Puis dans votre terminal :

```bash
git remote add origin https://github.com/application-belleya/belleya-app.git
git branch -M main
git push -u origin main
```

---

## 👥 Gérer les accès de l'équipe

### Ajouter des membres

1. Sur GitHub, allez sur votre repository
2. **Settings** > **Collaborators and teams**
3. **Add teams** ou **Add people**
4. Sélectionnez les membres de votre équipe
5. Choisissez le niveau d'accès :
   - **Read** : Peut voir et cloner
   - **Triage** : Peut gérer les issues
   - **Write** : Peut push et merge
   - **Maintain** : Peut gérer le repo (sans suppression)
   - **Admin** : Accès complet

### Créer des équipes

1. Sur votre organisation GitHub : `github.com/application-belleya`
2. **Teams** > **New team**
3. **Team name** : `belleya-developers`, `belleya-designers`, etc.
4. Ajoutez les membres
5. Assignez les équipes au repository

---

## 🚀 Configuration CI/CD pour l'équipe

### GitHub Actions (recommandé)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy Belleya

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Secrets à configurer

Sur GitHub : **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Ajoutez :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 🔧 Configuration locale pour chaque membre

### 1. Cloner le repository

```bash
git clone https://github.com/application-belleya/belleya-app.git
cd belleya-app
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Copiez le fichier d'exemple :

```bash
cp .env.team.example .env
```

Puis remplissez avec les vraies valeurs (demandez-les au chef de projet).

### 4. Lancer en développement

```bash
npm run dev
```

---

## 📋 Workflow de développement en équipe

### Branches recommandées

```
main          → Production (protégée)
├── develop   → Développement actif
├── staging   → Tests avant production
└── feature/* → Fonctionnalités individuelles
```

### Créer une nouvelle fonctionnalité

```bash
# Créer une branche depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/nom-de-la-fonctionnalite

# Travailler sur votre code
# ...

# Commit et push
git add .
git commit -m "feat: Description de la fonctionnalité"
git push origin feature/nom-de-la-fonctionnalite
```

### Créer une Pull Request

1. Sur GitHub, allez sur votre repository
2. **Pull requests** > **New pull request**
3. **base**: `develop` ← **compare**: `feature/nom-de-la-fonctionnalite`
4. Ajoutez une description détaillée
5. Assignez des reviewers
6. **Create pull request**

### Code Review

Les membres de l'équipe doivent :
1. Lire le code
2. Tester localement si nécessaire
3. Commenter les améliorations
4. **Approve** ou **Request changes**

### Merge

Une fois approuvé :
1. **Merge pull request**
2. **Delete branch** (nettoie le repo)

---

## 🔒 Protéger les branches importantes

### Configuration recommandée

Sur GitHub : **Settings** > **Branches** > **Add branch protection rule**

Pour la branche `main` :

```
☑️ Require a pull request before merging
  ☑️ Require approvals (minimum 1)
  ☑️ Dismiss stale pull request approvals when new commits are pushed
☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
☑️ Require conversation resolution before merging
☑️ Include administrators (recommandé)
```

---

## 📊 Outils de collaboration

### Discord/Slack pour la communication
- Channel #dev-belleya
- Channel #bugs
- Channel #deployments

### Trello/Notion pour la gestion de projet
- Backlog
- En cours
- En review
- Terminé

### Figma pour le design
- Partagez les maquettes
- Commentaires directement sur le design

---

## 🆘 Problèmes courants

### Erreur : "Permission denied"

**Solution** : Vérifiez que votre token GitHub a les bons scopes et qu'il n'a pas expiré.

### Erreur : "Organization not found"

**Solution** : Vérifiez que vous êtes bien membre de l'organisation `application-belleya`.

### Conflit de merge

```bash
# Récupérer les dernières modifications
git fetch origin
git merge origin/develop

# Résoudre les conflits manuellement
# Puis :
git add .
git commit -m "fix: Résolution des conflits"
git push
```

---

## ✅ Checklist pour nouveaux membres

- [ ] Accès à l'organisation GitHub `application-belleya`
- [ ] Repository cloné localement
- [ ] Fichier `.env` configuré
- [ ] `npm install` exécuté avec succès
- [ ] `npm run dev` fonctionne
- [ ] Accès à Supabase Dashboard (si nécessaire)
- [ ] Accès à Stripe Dashboard (si nécessaire)
- [ ] Ajouté au channel Discord/Slack de l'équipe
- [ ] Première Pull Request de test créée et mergée

---

**Créé le** : 14 février 2026
**Pour** : Équipe application-belleya
