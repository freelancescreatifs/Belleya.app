@echo off
REM Script de connexion du projet Belleya à Bolt.new (Windows)
REM Utilisation : connect-to-bolt.bat

echo.
echo ================================
echo   Configuration Belleya pour Bolt.new
echo ================================
echo.

REM Étape 1 : Vérifier si git est initialisé
echo [1/5] Verification de Git...
if not exist .git (
  echo Initialisation de Git...
  git init
  echo [OK] Git initialise
) else (
  echo [OK] Git deja initialise
)
echo.

REM Étape 2 : Créer .gitignore si nécessaire
echo [2/5] Verification du .gitignore...
if not exist .gitignore (
  echo Creation du .gitignore...
  (
    echo # Logs
    echo logs
    echo *.log
    echo npm-debug.log*
    echo yarn-debug.log*
    echo.
    echo node_modules
    echo dist
    echo dist-ssr
    echo *.local
    echo.
    echo # Editor directories
    echo .vscode/*
    echo !.vscode/extensions.json
    echo .idea
    echo .DS_Store
    echo.
    echo # Environment variables
    echo .env
    echo .env.local
    echo .env.*.local
    echo.
    echo # Build files
    echo build/
  ) > .gitignore
  echo [OK] .gitignore cree
) else (
  echo [OK] .gitignore existe deja
)
echo.

REM Étape 3 : Demander l'URL du repository
echo [3/5] Configuration du repository distant
echo.
echo Entrez l'URL de votre repository GitHub :
echo Exemple : https://github.com/application-belleya/belleya-app.git
echo.
set /p REPO_URL="URL : "

if "%REPO_URL%"=="" (
  echo [ERREUR] URL vide
  pause
  exit /b 1
)

REM Vérifier si origin existe
git remote | findstr "^origin$" >nul 2>&1
if %errorlevel%==0 (
  echo Remote 'origin' existe deja, mise a jour...
  git remote set-url origin %REPO_URL%
) else (
  echo Ajout du remote 'origin'...
  git remote add origin %REPO_URL%
)
echo [OK] Remote configure : %REPO_URL%
echo.

REM Étape 4 : Commit de tous les fichiers
echo [4/5] Commit des fichiers...
echo Ajout de tous les fichiers...
git add .

echo Creation du commit...
git commit -m "feat: Initial commit - Belleya application with full features"

echo [OK] Commit cree
echo.

REM Étape 5 : Push vers GitHub
echo [5/5] Push vers GitHub...
echo Verification de la branche...

REM Renommer vers main si nécessaire
git branch -M main

echo Push en cours...
git push -u origin main

if %errorlevel%==0 (
  echo.
  echo ================================
  echo   SUCCESS ! Projet pousse sur GitHub
  echo ================================
  echo.
  echo Prochaines etapes :
  echo.
  echo 1. Allez sur Bolt.new : https://bolt.new
  echo.
  echo 2. Cliquez sur 'Import from GitHub'
  echo.
  echo 3. Autorisez Bolt a acceder a votre compte GitHub
  echo.
  echo 4. Selectionnez votre repository : application-belleya/belleya-app
  echo.
  echo 5. Bolt va cloner et configurer automatiquement le projet
  echo.
  echo N'oubliez pas de configurer les variables d'environnement dans Bolt :
  echo   - VITE_SUPABASE_URL
  echo   - VITE_SUPABASE_ANON_KEY
  echo   - VITE_MAPBOX_TOKEN
  echo.
  echo Vous pouvez maintenant collaborer avec votre equipe sur Bolt.new !
) else (
  echo.
  echo [ERREUR] Erreur lors du push
  echo.
  echo Causes possibles :
  echo 1. Le repository n'existe pas encore sur GitHub
  echo    - Creez-le d'abord sur : https://github.com/organizations/application-belleya/repositories/new
  echo.
  echo 2. Vous n'avez pas les permissions
  echo    - Verifiez vos acces a l'organisation 'application-belleya'
  echo.
  echo 3. Authentification necessaire
  echo    - Configurez votre token et reessayez : git push -u origin main
)

echo.
pause
