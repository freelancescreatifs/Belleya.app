#!/bin/bash

# Script pour remplacer toutes les anciennes couleurs rose/pink par les nouvelles couleurs Belleya

echo "🎨 Mise à jour des couleurs vers la palette Belleya..."

# Fonction pour remplacer dans tous les fichiers .tsx
replace_in_files() {
    find src -name "*.tsx" -type f -exec sed -i '' \
        -e 's/bg-rose-50/bg-belleya-50/g' \
        -e 's/bg-rose-100/bg-belleya-100/g' \
        -e 's/bg-rose-200/bg-belleya-200/g' \
        -e 's/bg-rose-300/bg-belleya-300/g' \
        -e 's/bg-rose-400/bg-belleya-400/g' \
        -e 's/bg-rose-500/bg-belleya-500/g' \
        -e 's/bg-rose-600/bg-belleya-primary/g' \
        -e 's/bg-rose-700/bg-belleya-700/g' \
        -e 's/bg-pink-50/bg-belleya-50/g' \
        -e 's/bg-pink-100/bg-belleya-100/g' \
        -e 's/bg-pink-500/bg-belleya-500/g' \
        -e 's/bg-pink-600/bg-belleya-primary/g' \
        -e 's/text-rose-50/text-belleya-50/g' \
        -e 's/text-rose-100/text-belleya-100/g' \
        -e 's/text-rose-200/text-belleya-200/g' \
        -e 's/text-rose-300/text-belleya-300/g' \
        -e 's/text-rose-400/text-belleya-400/g' \
        -e 's/text-rose-500/text-belleya-primary/g' \
        -e 's/text-rose-600/text-belleya-primary/g' \
        -e 's/text-rose-700/text-belleya-deep/g' \
        -e 's/text-rose-800/text-belleya-800/g' \
        -e 's/text-pink-500/text-belleya-primary/g' \
        -e 's/text-pink-600/text-belleya-primary/g' \
        -e 's/border-rose-50/border-belleya-50/g' \
        -e 's/border-rose-100/border-belleya-100/g' \
        -e 's/border-rose-200/border-belleya-200/g' \
        -e 's/border-rose-300/border-belleya-300/g' \
        -e 's/border-rose-400/border-belleya-400/g' \
        -e 's/border-rose-500/border-belleya-primary/g' \
        -e 's/border-rose-600/border-belleya-primary/g' \
        -e 's/border-pink-500/border-belleya-primary/g' \
        -e 's/border-pink-600/border-belleya-primary/g' \
        -e 's/ring-rose-500/ring-belleya-primary/g' \
        -e 's/ring-rose-600/ring-belleya-primary/g' \
        -e 's/hover:bg-rose-50/hover:bg-belleya-50/g' \
        -e 's/hover:bg-rose-100/hover:bg-belleya-100/g' \
        -e 's/hover:bg-rose-600/hover:bg-belleya-primary/g' \
        -e 's/hover:text-rose-600/hover:text-belleya-primary/g' \
        -e 's/hover:text-rose-700/hover:text-belleya-deep/g' \
        -e 's/hover:border-rose-600/hover:border-belleya-primary/g' \
        -e 's/focus:ring-rose-500/focus:ring-belleya-primary/g' \
        -e 's/focus:border-rose-500/focus:border-belleya-primary/g' \
        {} \;
}

# Exécuter les remplacements
replace_in_files

echo "✅ Couleurs mises à jour avec succès!"
echo "📋 Vérifiez les fichiers modifiés avec: git diff"
