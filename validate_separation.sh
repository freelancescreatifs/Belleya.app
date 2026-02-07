#!/bin/bash

# ============================================================================
# Script de Validation: Séparation ClientPulse ↔ Belleya
# ============================================================================
# Ce script valide que la séparation entre ClientPulse et Belleya est complète
# et qu'aucune trace de ClientPulse ne reste dans le projet Belleya.
#
# Usage: ./validate_separation.sh
# ============================================================================

# Note: On ne met PAS set -e pour que le script continue même si une vérification échoue
# set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Fonction pour afficher les résultats
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Validation Séparation ClientPulse ↔ Belleya                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

check_pass() {
    ((TOTAL_CHECKS++))
    ((PASSED_CHECKS++))
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    ((TOTAL_CHECKS++))
    ((FAILED_CHECKS++))
    echo -e "${RED}✗${NC} $1"
}

check_warning() {
    ((TOTAL_CHECKS++))
    ((WARNING_CHECKS++))
    echo -e "${YELLOW}⚠${NC} $1"
}

print_summary() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Résumé de la Validation                                      ║${NC}"
    echo -e "${BLUE}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BLUE}║${NC}  Total checks:    $TOTAL_CHECKS"
    echo -e "${BLUE}║${NC}  ${GREEN}Passed:${NC}        $PASSED_CHECKS"
    echo -e "${BLUE}║${NC}  ${YELLOW}Warnings:${NC}      $WARNING_CHECKS"
    echo -e "${BLUE}║${NC}  ${RED}Failed:${NC}        $FAILED_CHECKS"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ Séparation validée avec succès !${NC}"
        if [ $WARNING_CHECKS -gt 0 ]; then
            echo -e "${YELLOW}⚠ Attention: $WARNING_CHECKS warnings à vérifier${NC}"
        fi
        exit 0
    else
        echo -e "${RED}✗ Séparation incomplète: $FAILED_CHECKS erreurs détectées${NC}"
        exit 1
    fi
}

# ============================================================================
# CHECK 1: Variables d'Environnement
# ============================================================================

print_header
print_section "1. Variables d'Environnement"

# Vérifier que .env existe
if [ ! -f ".env" ]; then
    check_fail ".env file not found"
else
    check_pass ".env file exists"

    # Vérifier VITE_SUPABASE_URL
    if grep -q "VITE_SUPABASE_URL=" .env; then
        SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" .env | cut -d '=' -f2)
        if [[ $SUPABASE_URL == *"lldznuayrxzvliehywoc"* ]]; then
            check_pass "VITE_SUPABASE_URL points to Belleya project"
        elif [[ $SUPABASE_URL == *"xxxxx"* ]]; then
            check_warning "VITE_SUPABASE_URL is placeholder (needs real Belleya URL)"
        else
            check_warning "VITE_SUPABASE_URL points to unknown project: $SUPABASE_URL"
        fi
    else
        check_fail "VITE_SUPABASE_URL not found in .env"
    fi

    # Vérifier VITE_SUPABASE_ANON_KEY
    if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
        check_pass "VITE_SUPABASE_ANON_KEY is set"
    else
        check_fail "VITE_SUPABASE_ANON_KEY not found in .env"
    fi

    # Vérifier VITE_PROJECT_NAME
    if grep -q "VITE_PROJECT_NAME=Belleya" .env; then
        check_pass "VITE_PROJECT_NAME is 'Belleya'"
    elif grep -q "VITE_PROJECT_NAME=" .env; then
        PROJECT_NAME=$(grep "VITE_PROJECT_NAME=" .env | cut -d '=' -f2)
        check_fail "VITE_PROJECT_NAME is '$PROJECT_NAME' (should be 'Belleya')"
    else
        check_warning "VITE_PROJECT_NAME not set (optional but recommended)"
    fi
fi

echo ""

# ============================================================================
# CHECK 2: URLs Hardcodées dans le Code
# ============================================================================

print_section "2. URLs Hardcodées dans le Code"

# Chercher toutes les URLs supabase.co dans src/
HARDCODED_URLS=$(grep -r "https://.*\.supabase\.co" src/ 2>/dev/null | grep -v "node_modules" | grep -v "dist" || true)

if [ -z "$HARDCODED_URLS" ]; then
    check_pass "No hardcoded Supabase URLs found in src/"
else
    check_fail "Hardcoded Supabase URLs found in src/:"
    echo "$HARDCODED_URLS"
fi

echo ""

# ============================================================================
# CHECK 3: Clés API Hardcodées
# ============================================================================

print_section "3. Clés API Hardcodées"

# Chercher les clés JWT hardcodées (commencent par eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)
HARDCODED_KEYS=$(grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ 2>/dev/null | grep -v "node_modules" | grep -v "dist" || true)

if [ -z "$HARDCODED_KEYS" ]; then
    check_pass "No hardcoded API keys found in src/"
else
    check_fail "Hardcoded API keys found in src/:"
    echo "$HARDCODED_KEYS"
fi

echo ""

# ============================================================================
# CHECK 4: Références ClientPulse dans le Code
# ============================================================================

print_section "4. Références ClientPulse dans le Code"

# Chercher "clientpulse" dans src/ (case insensitive)
CLIENTPULSE_REFS=$(grep -ri "clientpulse" src/ 2>/dev/null | grep -v "node_modules" | grep -v "dist" || true)

if [ -z "$CLIENTPULSE_REFS" ]; then
    check_pass "No 'ClientPulse' references found in src/"
else
    check_fail "'ClientPulse' references found in src/:"
    echo "$CLIENTPULSE_REFS"
fi

echo ""

# ============================================================================
# CHECK 5: Configuration Supabase Client
# ============================================================================

print_section "5. Configuration Supabase Client"

# Vérifier src/lib/supabase.ts
if [ ! -f "src/lib/supabase.ts" ]; then
    check_fail "src/lib/supabase.ts not found"
else
    check_pass "src/lib/supabase.ts exists"

    # Vérifier que les variables d'environnement sont utilisées
    if grep -q "import.meta.env.VITE_SUPABASE_URL" src/lib/supabase.ts; then
        check_pass "Using import.meta.env.VITE_SUPABASE_URL (good)"
    else
        check_fail "Not using import.meta.env.VITE_SUPABASE_URL"
    fi

    if grep -q "import.meta.env.VITE_SUPABASE_ANON_KEY" src/lib/supabase.ts; then
        check_pass "Using import.meta.env.VITE_SUPABASE_ANON_KEY (good)"
    else
        check_fail "Not using import.meta.env.VITE_SUPABASE_ANON_KEY"
    fi

    # Vérifier qu'il n'y a pas d'URL hardcodée
    if grep -q "https://.*\.supabase\.co" src/lib/supabase.ts; then
        check_fail "Hardcoded Supabase URL found in src/lib/supabase.ts"
    else
        check_pass "No hardcoded URL in src/lib/supabase.ts (good)"
    fi
fi

echo ""

# ============================================================================
# CHECK 6: Migrations Database
# ============================================================================

print_section "6. Migrations Database"

# Vérifier que le dossier supabase/migrations existe
if [ ! -d "supabase/migrations" ]; then
    check_warning "supabase/migrations directory not found (optional)"
else
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    check_pass "Found $MIGRATION_COUNT migrations in supabase/migrations/"

    # Vérifier que la migration de fix signup existe
    if [ -f "supabase/migrations/fix_signup_triggers_rls_bypass.sql" ]; then
        check_pass "fix_signup_triggers_rls_bypass.sql migration found"
    else
        check_warning "fix_signup_triggers_rls_bypass.sql migration not found (may need to be applied)"
    fi
fi

echo ""

# ============================================================================
# CHECK 7: Edge Functions (si présentes)
# ============================================================================

print_section "7. Edge Functions"

if [ -d "supabase/functions" ]; then
    FUNCTION_COUNT=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l)
    check_pass "Found $FUNCTION_COUNT edge functions"

    # Vérifier que les fonctions n'ont pas d'URLs hardcodées
    for func_dir in supabase/functions/*/; do
        func_name=$(basename "$func_dir")
        if grep -r "https://.*\.supabase\.co" "$func_dir" 2>/dev/null | grep -v "node_modules" >/dev/null; then
            check_fail "Hardcoded URL found in edge function: $func_name"
        else
            check_pass "No hardcoded URL in edge function: $func_name"
        fi
    done
else
    check_pass "No edge functions directory (OK)"
fi

echo ""

# ============================================================================
# CHECK 8: .gitignore
# ============================================================================

print_section "8. .gitignore Configuration"

if [ ! -f ".gitignore" ]; then
    check_warning ".gitignore not found"
else
    check_pass ".gitignore exists"

    # Vérifier que .env est ignoré
    if grep -q "^\.env$" .gitignore || grep -q "^\.env" .gitignore; then
        check_pass ".env is in .gitignore (good)"
    else
        check_fail ".env is NOT in .gitignore (security risk!)"
    fi

    # Vérifier que les credentials ne sont pas commités
    if grep -q "\.env\.local" .gitignore; then
        check_pass ".env.local is in .gitignore (good)"
    else
        check_warning ".env.local not in .gitignore (should add it)"
    fi
fi

echo ""

# ============================================================================
# CHECK 9: Package.json
# ============================================================================

print_section "9. Package.json"

if [ ! -f "package.json" ]; then
    check_fail "package.json not found"
else
    check_pass "package.json exists"

    # Vérifier que @supabase/supabase-js est installé
    if grep -q "@supabase/supabase-js" package.json; then
        check_pass "@supabase/supabase-js dependency found"
    else
        check_fail "@supabase/supabase-js dependency not found"
    fi

    # Vérifier la version de @supabase/supabase-js
    SUPABASE_VERSION=$(grep "@supabase/supabase-js" package.json | grep -oP '\d+\.\d+\.\d+' | head -1)
    if [ -n "$SUPABASE_VERSION" ]; then
        check_pass "@supabase/supabase-js version: $SUPABASE_VERSION"
    fi
fi

echo ""

# ============================================================================
# CHECK 10: Build Configuration
# ============================================================================

print_section "10. Build Configuration"

# Vérifier que vite.config.ts existe
if [ ! -f "vite.config.ts" ]; then
    check_warning "vite.config.ts not found (may not be using Vite)"
else
    check_pass "vite.config.ts exists"
fi

# Vérifier que tsconfig.json existe
if [ ! -f "tsconfig.json" ]; then
    check_warning "tsconfig.json not found"
else
    check_pass "tsconfig.json exists"
fi

echo ""

# ============================================================================
# CHECK 11: Documentation
# ============================================================================

print_section "11. Documentation"

# Vérifier que .env.belleya.example existe
if [ ! -f ".env.belleya.example" ]; then
    check_warning ".env.belleya.example not found (should create one)"
else
    check_pass ".env.belleya.example exists"
fi

# Vérifier que README ou guide de setup existe
if [ -f "README.md" ] || [ -f "BELLEYA_ENV_SETUP.md" ]; then
    check_pass "Setup documentation found"
else
    check_warning "No setup documentation found (should create one)"
fi

echo ""

# ============================================================================
# CHECK 12: Node Modules
# ============================================================================

print_section "12. Dependencies"

if [ ! -d "node_modules" ]; then
    check_warning "node_modules not found (run 'npm install')"
else
    check_pass "node_modules directory exists"

    # Vérifier que @supabase/supabase-js est installé
    if [ -d "node_modules/@supabase/supabase-js" ]; then
        check_pass "@supabase/supabase-js installed"
    else
        check_fail "@supabase/supabase-js NOT installed (run 'npm install')"
    fi
fi

echo ""

# ============================================================================
# RÉSUMÉ FINAL
# ============================================================================

print_summary
