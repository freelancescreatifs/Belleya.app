#!/bin/bash

# Script de connexion du projet Belleya à Bolt.new
# Utilisation : bash connect-to-bolt.sh

echo "🚀 Configuration du projet Belleya pour Bolt.new"
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1 : Vérifier si git est initialisé
echo -e "${BLUE}📦 Étape 1/5 : Vérification de Git${NC}"
if [ ! -d .git ]; then
  echo "Initialisation de Git..."
  git init
  echo -e "${GREEN}✓ Git initialisé${NC}"
else
  echo -e "${GREEN}✓ Git déjà initialisé${NC}"
fi
echo ""

# Étape 2 : Créer .gitignore si nécessaire
echo -e "${BLUE}📝 Étape 2/5 : Vérification du .gitignore${NC}"
if [ ! -f .gitignore ]; then
  echo "Création du .gitignore..."
  cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.*.local

# Build files
build/
EOF
  echo -e "${GREEN}✓ .gitignore créé${NC}"
else
  echo -e "${GREEN}✓ .gitignore existe déjà${NC}"
fi
echo ""

# Étape 3 : Demander l'URL du repository
echo -e "${BLUE}🔗 Étape 3/5 : Configuration du repository distant${NC}"
echo -e "${YELLOW}Entrez l'URL de votre repository GitHub :${NC}"
echo -e "${YELLOW}Exemple : https://github.com/application-belleya/belleya-app.git${NC}"
read -p "URL : " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "❌ Erreur : URL vide"
  exit 1
fi

# Vérifier si origin existe déjà
if git remote | grep -q "^origin$"; then
  echo "Remote 'origin' existe déjà, mise à jour..."
  git remote set-url origin "$REPO_URL"
else
  echo "Ajout du remote 'origin'..."
  git remote add origin "$REPO_URL"
fi
echo -e "${GREEN}✓ Remote configuré : $REPO_URL${NC}"
echo ""

# Étape 4 : Commit de tous les fichiers
echo -e "${BLUE}💾 Étape 4/5 : Commit des fichiers${NC}"
echo "Ajout de tous les fichiers..."
git add .

echo "Création du commit..."
git commit -m "feat: Initial commit - Belleya application with full features

- Complete Belleya application setup
- Supabase integration configured
- Multi-module system (Agenda, Clients, Content, Finance, etc.)
- Team collaboration ready
- Production deployment ready"

echo -e "${GREEN}✓ Commit créé${NC}"
echo ""

# Étape 5 : Push vers GitHub
echo -e "${BLUE}🚀 Étape 5/5 : Push vers GitHub${NC}"
echo "Push de la branche main..."

# Vérifier si on est sur main, sinon créer/renommer
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Renommage de la branche vers 'main'..."
  git branch -M main
fi

echo "Push en cours..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ SUCCESS ! Projet poussé sur GitHub${NC}"
  echo ""
  echo -e "${BLUE}📋 Prochaines étapes :${NC}"
  echo ""
  echo "1️⃣  Allez sur Bolt.new : https://bolt.new"
  echo ""
  echo "2️⃣  Cliquez sur 'Import from GitHub'"
  echo ""
  echo "3️⃣  Autorisez Bolt à accéder à votre compte GitHub"
  echo ""
  echo "4️⃣  Sélectionnez votre repository : application-belleya/belleya-app"
  echo ""
  echo "5️⃣  Bolt va cloner et configurer automatiquement le projet"
  echo ""
  echo -e "${YELLOW}⚠️  N'oubliez pas de configurer les variables d'environnement dans Bolt :${NC}"
  echo "   - VITE_SUPABASE_URL"
  echo "   - VITE_SUPABASE_ANON_KEY"
  echo "   - VITE_MAPBOX_TOKEN"
  echo ""
  echo -e "${GREEN}🎉 Vous pouvez maintenant collaborer avec votre équipe sur Bolt.new !${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠️  Erreur lors du push${NC}"
  echo ""
  echo "Causes possibles :"
  echo "1. Le repository n'existe pas encore sur GitHub"
  echo "   → Créez-le d'abord : https://github.com/organizations/application-belleya/repositories/new"
  echo ""
  echo "2. Vous n'avez pas les permissions"
  echo "   → Vérifiez vos accès à l'organisation 'application-belleya'"
  echo ""
  echo "3. Authentification nécessaire"
  echo "   → Configurez votre token : git config --global credential.helper store"
  echo "   → Puis réessayez : git push -u origin main"
fi
